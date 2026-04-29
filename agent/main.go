package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

// ─── Constants ────────────────────────────────────────────────────────────────

const (
	reportURL    = "https://hostguard.duckdns.org/api/report"
	interval     = 10 * time.Minute
	maxRetries   = 3
	retryBackoff = 5 * time.Second
)

// ─── Payload types ────────────────────────────────────────────────────────────

type Package struct {
	PackageName string `json:"packageName"`
	Version     string `json:"version"`
}

type Check struct {
	Title       string `json:"title"`
	Status      string `json:"status"`
	Severity    string `json:"severity"`
	Evidence    string `json:"evidence"`
	Remediation string `json:"remediation"`
}

type Report struct {
	HostID          string    `json:"hostId"`
	Hostname        string    `json:"hostname"`
	IP              string    `json:"ip"`
	OS              string    `json:"os"`
	ComplianceScore float64   `json:"complianceScore"`
	Packages        []Package `json:"packages"`
	Checks          []Check   `json:"checks"`
}

// ─── Collectors ───────────────────────────────────────────────────────────────

func getMachineID() string {
	data, err := os.ReadFile("/etc/machine-id")
	if err != nil {
		log.Printf("[WARN] Cannot read /etc/machine-id: %v", err)
		return "unknown"
	}
	return strings.TrimSpace(string(data))
}

func getHostname() string {
	h, err := os.Hostname()
	if err != nil {
		return "unknown"
	}
	return h
}

func getPrivateIP() string {
	ifaces, err := net.Interfaces()
	if err != nil {
		return "unknown"
	}
	for _, iface := range ifaces {
		if iface.Flags&net.FlagLoopback != 0 || iface.Flags&net.FlagUp == 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}
			if ip == nil || ip.IsLoopback() {
				continue
			}
			if ipv4 := ip.To4(); ipv4 != nil {
				return ipv4.String()
			}
		}
	}
	return "unknown"
}

func getOSName() string {
	// Try /etc/os-release first
	data, err := os.ReadFile("/etc/os-release")
	if err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			if strings.HasPrefix(line, "PRETTY_NAME=") {
				val := strings.TrimPrefix(line, "PRETTY_NAME=")
				return strings.Trim(val, `"`)
			}
		}
	}
	// Fallback to runtime GOOS
	return runtime.GOOS
}

func getPackages() []Package {
	var pkgs []Package

	// Try dpkg (Debian/Ubuntu)
	out, err := exec.Command("dpkg", "-l").Output()
	if err == nil {
		for _, line := range strings.Split(string(out), "\n") {
			if !strings.HasPrefix(line, "ii") {
				continue
			}
			fields := strings.Fields(line)
			if len(fields) < 3 {
				continue
			}
			pkgs = append(pkgs, Package{
				PackageName: fields[1],
				Version:     fields[2],
			})
		}
		return pkgs
	}

	// Try rpm (RHEL/CentOS/Fedora)
	out, err = exec.Command("rpm", "-qa", "--queryformat", "%{NAME}\t%{VERSION}\n").Output()
	if err == nil {
		for _, line := range strings.Split(string(out), "\n") {
			parts := strings.SplitN(strings.TrimSpace(line), "\t", 2)
			if len(parts) < 2 || parts[0] == "" {
				continue
			}
			pkgs = append(pkgs, Package{
				PackageName: parts[0],
				Version:     parts[1],
			})
		}
		return pkgs
	}

	log.Println("[WARN] Neither dpkg nor rpm available — no packages collected")
	return pkgs
}

// ─── CIS Checks ───────────────────────────────────────────────────────────────

func runShell(cmd string) (string, error) {
	out, err := exec.Command("sh", "-c", cmd).CombinedOutput()
	return strings.TrimSpace(string(out)), err
}

func checkSSHRootLogin() Check {
	c := Check{
		Title:       "SSH root login disabled",
		Severity:    "HIGH",
		Remediation: "Set 'PermitRootLogin no' in /etc/ssh/sshd_config and restart sshd",
	}
	out, err := runShell(`grep -Ei "^\s*PermitRootLogin\s+no" /etc/ssh/sshd_config`)
	if err == nil && strings.Contains(strings.ToLower(out), "no") {
		c.Status = "PASS"
		c.Evidence = "PermitRootLogin no found in sshd_config"
	} else {
		c.Status = "FAIL"
		out2, _ := runShell(`grep -i PermitRootLogin /etc/ssh/sshd_config`)
		c.Evidence = fmt.Sprintf("Current value: %s", strings.TrimSpace(out2))
	}
	return c
}

func checkFirewall() Check {
	c := Check{
		Title:       "Firewall is enabled",
		Severity:    "HIGH",
		Remediation: "Enable ufw or firewalld: 'ufw enable' OR 'systemctl enable --now firewalld'",
	}
	// ufw
	out, _ := runShell("ufw status 2>/dev/null")
	if strings.Contains(strings.ToLower(out), "active") {
		c.Status = "PASS"
		c.Evidence = "ufw is active"
		return c
	}
	// firewalld
	out, _ = runShell("systemctl is-active firewalld 2>/dev/null")
	if strings.TrimSpace(out) == "active" {
		c.Status = "PASS"
		c.Evidence = "firewalld is active"
		return c
	}
	// iptables fallback — non-empty rule count
	out, _ = runShell("iptables -L --line-numbers 2>/dev/null | grep -c '^[0-9]'")
	if out != "" && out != "0" {
		c.Status = "PASS"
		c.Evidence = fmt.Sprintf("iptables has %s active rules", out)
		return c
	}
	c.Status = "FAIL"
	c.Evidence = "No active firewall detected (ufw/firewalld/iptables)"
	return c
}

func checkPasswordMaxAge() Check {
	c := Check{
		Title:       "Password maximum age is set",
		Severity:    "MEDIUM",
		Remediation: "Set PASS_MAX_DAYS to 90 or less in /etc/login.defs",
	}
	out, err := runShell(`grep -E "^\s*PASS_MAX_DAYS" /etc/login.defs`)
	if err == nil && out != "" {
		fields := strings.Fields(out)
		if len(fields) >= 2 {
			days := fields[1]
			c.Evidence = fmt.Sprintf("PASS_MAX_DAYS = %s", days)
			if days != "99999" && days != "0" {
				c.Status = "PASS"
			} else {
				c.Status = "FAIL"
			}
		} else {
			c.Status = "FAIL"
			c.Evidence = "PASS_MAX_DAYS line malformed"
		}
	} else {
		c.Status = "FAIL"
		c.Evidence = "PASS_MAX_DAYS not found in /etc/login.defs"
	}
	return c
}

func checkAuditd() Check {
	c := Check{
		Title:       "Auditd service is running",
		Severity:    "MEDIUM",
		Remediation: "Install and enable auditd: 'apt install auditd' and 'systemctl enable --now auditd'",
	}
	out, _ := runShell("systemctl is-active auditd 2>/dev/null")
	if strings.TrimSpace(out) == "active" {
		c.Status = "PASS"
		c.Evidence = "auditd is active"
	} else {
		c.Status = "FAIL"
		c.Evidence = fmt.Sprintf("auditd status: %s", strings.TrimSpace(out))
	}
	return c
}

func checkSELinuxOrAppArmor() Check {
	c := Check{
		Title:       "Mandatory Access Control (SELinux/AppArmor) is enforcing",
		Severity:    "MEDIUM",
		Remediation: "Enable AppArmor ('systemctl enable --now apparmor') or set SELinux to enforcing",
	}
	// AppArmor
	out, _ := runShell("aa-status --enabled 2>/dev/null; echo $?")
	if strings.TrimSpace(out) == "0" {
		c.Status = "PASS"
		c.Evidence = "AppArmor is enabled"
		return c
	}
	// SELinux
	out, _ = runShell("getenforce 2>/dev/null")
	if strings.TrimSpace(strings.ToLower(out)) == "enforcing" {
		c.Status = "PASS"
		c.Evidence = "SELinux is in Enforcing mode"
		return c
	}
	c.Status = "FAIL"
	c.Evidence = fmt.Sprintf("SELinux: %s; AppArmor not enabled", strings.TrimSpace(out))
	return c
}

func checkSSHProtocol() Check {
	c := Check{
		Title:       "SSH Protocol 2 enforced",
		Severity:    "HIGH",
		Remediation: "Ensure 'Protocol 2' is set in /etc/ssh/sshd_config (default in modern OpenSSH)",
	}
	// Modern OpenSSH does not use the Protocol directive but only supports v2 by default.
	out, err := runShell("ssh -V 2>&1")
	if err == nil && strings.Contains(out, "OpenSSH") {
		// Check whether Protocol 1 is explicitly allowed
		p1, _ := runShell(`grep -Ei "^\s*Protocol\s+1" /etc/ssh/sshd_config`)
		if strings.TrimSpace(p1) == "" {
			c.Status = "PASS"
			c.Evidence = fmt.Sprintf("Protocol 1 not enabled. %s", strings.TrimSpace(out))
			return c
		}
		c.Status = "FAIL"
		c.Evidence = "Protocol 1 explicitly allowed in sshd_config"
		return c
	}
	c.Status = "FAIL"
	c.Evidence = "Unable to verify SSH version"
	return c
}

func runAllChecks() []Check {
	return []Check{
		checkSSHRootLogin(),
		checkFirewall(),
		checkPasswordMaxAge(),
		checkAuditd(),
		checkSELinuxOrAppArmor(),
		checkSSHProtocol(),
	}
}

// ─── Compliance score ─────────────────────────────────────────────────────────

func calcCompliance(checks []Check) float64 {
	if len(checks) == 0 {
		return 100.0
	}
	passed := 0
	for _, c := range checks {
		if c.Status == "PASS" {
			passed++
		}
	}
	return float64(passed) / float64(len(checks)) * 100.0
}

// ─── HTTP POST with retry ─────────────────────────────────────────────────────

func postReport(report Report) error {
	body, err := json.Marshal(report)
	if err != nil {
		return fmt.Errorf("json marshal: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}

	var lastErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		req, err := http.NewRequest(http.MethodPost, reportURL, bytes.NewReader(body))
		if err != nil {
			return fmt.Errorf("build request: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("attempt %d: %w", attempt, err)
			log.Printf("[WARN] POST failed (%d/%d): %v", attempt, maxRetries, err)
			time.Sleep(retryBackoff * time.Duration(attempt))
			continue
		}

		defer resp.Body.Close()
		respBody, _ := io.ReadAll(resp.Body)

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			log.Printf("[OK] Report sent successfully (HTTP %d): %s", resp.StatusCode, respBody)
			return nil
		}

		lastErr = fmt.Errorf("attempt %d: HTTP %d — %s", attempt, resp.StatusCode, respBody)
		log.Printf("[WARN] Server returned error (%d/%d): %v", attempt, maxRetries, lastErr)
		time.Sleep(retryBackoff * time.Duration(attempt))
	}
	return fmt.Errorf("all %d attempts failed; last error: %w", maxRetries, lastErr)
}

// ─── One scan cycle ───────────────────────────────────────────────────────────

func runScan() {
	log.Println("[INFO] Starting scan cycle ...")

	checks := runAllChecks()
	report := Report{
		HostID:          getMachineID(),
		Hostname:        getHostname(),
		IP:              getPrivateIP(),
		OS:              getOSName(),
		ComplianceScore: calcCompliance(checks),
		Packages:        getPackages(),
		Checks:          checks,
	}

	log.Printf("[INFO] Host: %s | IP: %s | OS: %s | Score: %.1f%% | Packages: %d | Checks: %d",
		report.Hostname, report.IP, report.OS, report.ComplianceScore,
		len(report.Packages), len(report.Checks))

	if err := postReport(report); err != nil {
		log.Printf("[ERROR] Failed to post report: %v", err)
	}
}

// ─── Entry point ──────────────────────────────────────────────────────────────

func main() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Printf("[INFO] Linux Security Agent starting — reporting to %s every %s", reportURL, interval)

	// Run immediately on startup
	runScan()

	// Then run on a fixed interval
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		runScan()
	}
}

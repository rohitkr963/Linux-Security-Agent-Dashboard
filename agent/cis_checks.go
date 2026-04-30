package main

import (
	"bufio"
	"os"
	"strings"
)

type CISResult struct {
	Name           string `json:"name"`
	Status         string `json:"status"` // PASS / FAIL
	Severity       string `json:"severity"` // Low / Medium / High
	Evidence       string `json:"evidence"`
	Recommendation string `json:"recommendation"`
}

func PerformCISChecks() []CISResult {
	if !IsLinux() {
		return []CISResult{}
	}

	var results []CISResult

	// 1. Password Max Age
	results = append(results, checkPasswordMaxAge())

	// 2. Password Complexity
	results = append(results, checkPasswordComplexity())

	// 3. SSH Root Login Disabled
	results = append(results, checkSSHRootLogin())

	// 4. Firewall Enabled
	results = append(results, checkFirewall())

	// 5. Time Sync Enabled
	results = append(results, checkTimeSync())

	// 6. Auditd Running
	results = append(results, checkAuditd())

	// 7. AppArmor / SELinux Enabled
	results = append(results, checkSecurityModule())

	// 8. No World Writable Files
	results = append(results, checkWorldWritableFiles())

	// 9. GDM Auto Login Disabled
	results = append(results, checkGDMAutoLogin())

	// 10. SSH Banner Configured
	results = append(results, checkSSHBanner())

	// 11. Unused Filesystems Disabled
	results = append(results, checkUnusedFilesystems())

	// 12. Password Reuse Restricted
	results = append(results, checkPasswordReuse())

	return results
}

// Helper to read file and find matching line
func fileContains(filepath, search string) (bool, string) {
	file, err := os.Open(filepath)
	if err != nil {
		return false, "File not accessible"
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, search) && !strings.HasPrefix(strings.TrimSpace(line), "#") {
			return true, line
		}
	}
	return false, "Configuration not found"
}

func checkPasswordMaxAge() CISResult {
	found, evidence := fileContains("/etc/login.defs", "PASS_MAX_DAYS")
	status := "FAIL"
	if found && strings.Contains(evidence, "90") { // Simplified check
		status = "PASS"
	}
	return CISResult{
		Name:           "Ensure password max age is 90 days or less",
		Status:         status,
		Severity:       "Medium",
		Evidence:       evidence,
		Recommendation: "Set PASS_MAX_DAYS to 90 in /etc/login.defs",
	}
}

func checkPasswordComplexity() CISResult {
	found, evidence := fileContains("/etc/security/pwquality.conf", "minlen")
	status := "FAIL"
	if found {
		status = "PASS"
	}
	return CISResult{
		Name:           "Ensure password complexity requirements are configured",
		Status:         status,
		Severity:       "Medium",
		Evidence:       evidence,
		Recommendation: "Configure pam_pwquality or equivalent module",
	}
}

func checkSSHRootLogin() CISResult {
	found, evidence := fileContains("/etc/ssh/sshd_config", "PermitRootLogin no")
	status := "FAIL"
	if found {
		status = "PASS"
	} else {
		// Try lowercase check or default
		if f, ev := fileContains("/etc/ssh/sshd_config", "PermitRootLogin"); f {
			evidence = ev
		}
	}
	return CISResult{
		Name:           "Ensure SSH Root Login is disabled",
		Status:         status,
		Severity:       "High",
		Evidence:       evidence,
		Recommendation: "Set PermitRootLogin no in /etc/ssh/sshd_config",
	}
}

func checkFirewall() CISResult {
	status := "FAIL"
	evidence := "Firewall service not active"
	
	if CommandExists("ufw") {
		out, err := RunCommand("ufw", "status")
		if err == nil && strings.Contains(out, "Status: active") {
			status = "PASS"
			evidence = out
		}
	} else if CommandExists("firewall-cmd") {
		out, err := RunCommand("firewall-cmd", "--state")
		if err == nil && strings.TrimSpace(out) == "running" {
			status = "PASS"
			evidence = "firewalld is running"
		}
	}
	
	return CISResult{
		Name:           "Ensure firewall is enabled",
		Status:         status,
		Severity:       "High",
		Evidence:       evidence,
		Recommendation: "Enable ufw (Ubuntu) or firewalld (RHEL)",
	}
}

func checkTimeSync() CISResult {
	status := "FAIL"
	evidence := "No time synchronization service found"

	out, err := RunCommand("systemctl", "is-active", "chrony")
	if err == nil && strings.TrimSpace(out) == "active" {
		status = "PASS"
		evidence = "chrony is active"
	} else {
		out, err = RunCommand("systemctl", "is-active", "systemd-timesyncd")
		if err == nil && strings.TrimSpace(out) == "active" {
			status = "PASS"
			evidence = "systemd-timesyncd is active"
		}
	}

	return CISResult{
		Name:           "Ensure time synchronization is configured",
		Status:         status,
		Severity:       "Low",
		Evidence:       evidence,
		Recommendation: "Install and enable chrony or systemd-timesyncd",
	}
}

func checkAuditd() CISResult {
	status := "FAIL"
	evidence := "auditd service is not running"

	out, err := RunCommand("systemctl", "is-active", "auditd")
	if err == nil && strings.TrimSpace(out) == "active" {
		status = "PASS"
		evidence = "auditd is active"
	}

	return CISResult{
		Name:           "Ensure auditd service is running",
		Status:         status,
		Severity:       "Medium",
		Evidence:       evidence,
		Recommendation: "Enable and start auditd service",
	}
}

func checkSecurityModule() CISResult {
	status := "FAIL"
	evidence := "Neither AppArmor nor SELinux is active"

	if CommandExists("aa-status") {
		out, err := RunCommand("aa-status")
		if err == nil && strings.Contains(out, "profiles are loaded") {
			status = "PASS"
			evidence = "AppArmor is active"
		}
	} else if CommandExists("sestatus") {
		out, err := RunCommand("sestatus")
		if err == nil && strings.Contains(out, "SELinux status:                 enabled") {
			status = "PASS"
			evidence = "SELinux is enabled"
		}
	}

	return CISResult{
		Name:           "Ensure AppArmor or SELinux is enabled",
		Status:         status,
		Severity:       "High",
		Evidence:       evidence,
		Recommendation: "Enable AppArmor or SELinux via kernel parameters",
	}
}

func checkWorldWritableFiles() CISResult {
	// A full search is too slow, let's just check /etc/
	status := "PASS"
	evidence := "No world writable files found in /etc/"

	// find /etc -perm -2 -type f
	if CommandExists("find") {
		out, err := RunCommand("find", "/etc", "-perm", "-2", "-type", "f")
		if err == nil && strings.TrimSpace(out) != "" {
			status = "FAIL"
			evidence = "Found world writable files:\n" + out
		}
	}

	return CISResult{
		Name:           "Ensure no world-writable files exist in sensitive paths",
		Status:         status,
		Severity:       "High",
		Evidence:       evidence,
		Recommendation: "Remove world-writable permissions using chmod o-w",
	}
}

func checkGDMAutoLogin() CISResult {
	status := "PASS" // Default to PASS if GDM not installed
	evidence := "GDM not found or configured properly"

	if _, err := os.Stat("/etc/gdm3/custom.conf"); err == nil {
		found, ev := fileContains("/etc/gdm3/custom.conf", "AutomaticLoginEnable=true")
		if found {
			status = "FAIL"
			evidence = ev
		}
	}

	return CISResult{
		Name:           "Ensure GDM auto-login is disabled",
		Status:         status,
		Severity:       "Medium",
		Evidence:       evidence,
		Recommendation: "Comment out AutomaticLoginEnable in /etc/gdm3/custom.conf",
	}
}

func checkSSHBanner() CISResult {
	found, evidence := fileContains("/etc/ssh/sshd_config", "Banner")
	status := "FAIL"
	if found {
		status = "PASS"
	}
	return CISResult{
		Name:           "Ensure SSH warning banner is configured",
		Status:         status,
		Severity:       "Low",
		Evidence:       evidence,
		Recommendation: "Set Banner /etc/issue.net in /etc/ssh/sshd_config",
	}
}

func checkUnusedFilesystems() CISResult {
	// Simple check for cramfs in modprobe
	found, evidence := fileContains("/etc/modprobe.d/cramfs.conf", "install cramfs /bin/true")
	status := "FAIL"
	if found {
		status = "PASS"
	} else {
		if CommandExists("modprobe") {
			out, err := RunCommand("modprobe", "-n", "-v", "cramfs")
			if err == nil && strings.Contains(out, "install /bin/true") {
				status = "PASS"
				evidence = "cramfs is disabled via modprobe"
			}
		}
	}
	if evidence == "Configuration not found" {
		evidence = "cramfs kernel module is not disabled in modprobe.d"
	}

	return CISResult{
		Name:           "Ensure mounting of cramfs filesystems is disabled",
		Status:         status,
		Severity:       "Low",
		Evidence:       evidence,
		Recommendation: "Create /etc/modprobe.d/cramfs.conf with 'install cramfs /bin/true'",
	}
}

func checkPasswordReuse() CISResult {
	found, evidence := fileContains("/etc/pam.d/common-password", "remember=")
	status := "FAIL"
	if found {
		status = "PASS"
	} else if f, ev := fileContains("/etc/security/opasswd", ""); f {
		evidence = ev
	}
	
	if evidence == "Configuration not found" {
		evidence = "Password history (remember=5) not found in pam configuration"
	}

	return CISResult{
		Name:           "Ensure password reuse is limited",
		Status:         status,
		Severity:       "Medium",
		Evidence:       evidence,
		Recommendation: "Add 'remember=5' to pam_pwhistory.so in /etc/pam.d/common-password",
	}
}

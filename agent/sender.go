package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// This structure matches what the live Node.js backend (reportController) expects.
type RemotePackage struct {
	PackageName string `json:"packageName"`
	Version     string `json:"version"`
}

type RemoteCheck struct {
	Title       string `json:"title"`
	Status      string `json:"status"`
	Severity    string `json:"severity"`
	Evidence    string `json:"evidence"`
	Remediation string `json:"remediation"`
}

type RemotePayload struct {
	HostID          string          `json:"hostId"`
	Hostname        string          `json:"hostname"`
	IP              string          `json:"ip"`
	OS              string          `json:"os"`
	ComplianceScore float64         `json:"complianceScore"`
	Packages        []RemotePackage `json:"packages"`
	Checks          []RemoteCheck   `json:"checks"`
}

// We still keep our local Payload struct so the retry queue inside main.go doesn't break
type Payload struct {
	HostInfo   HostInfo
	Packages   []Package
	CISResults []CISResult
}

func SendPayload(url string, hostInfo HostInfo, packages []Package, cisResults []CISResult) error {
	
	// Map internal packages to remote packages
	var remotePkgs []RemotePackage
	for _, p := range packages {
		remotePkgs = append(remotePkgs, RemotePackage{
			PackageName: p.Name,
			Version:     p.Version,
		})
	}

	// Map internal checks to remote checks
	var remoteChecks []RemoteCheck
	passed := 0
	for _, c := range cisResults {
		if c.Status == "PASS" {
			passed++
		}
		remoteChecks = append(remoteChecks, RemoteCheck{
			Title:       c.Name,
			Status:      c.Status,
			Severity:    c.Severity,
			Evidence:    c.Evidence,
			Remediation: c.Recommendation,
		})
	}

	score := 100.0
	if len(cisResults) > 0 {
		score = (float64(passed) / float64(len(cisResults))) * 100.0
	}

	// Read /etc/machine-id for a stable HostID
	hostId := "unknown"
	if data, err := os.ReadFile("/etc/machine-id"); err == nil {
		hostId = string(bytes.TrimSpace(data))
	} else {
		hostId = hostInfo.Hostname // Fallback
	}

	remotePayload := RemotePayload{
		HostID:          hostId,
		Hostname:        hostInfo.Hostname,
		IP:              hostInfo.IPAddress,
		OS:              fmt.Sprintf("%s %s", hostInfo.OSName, hostInfo.OSVersion),
		ComplianceScore: score,
		Packages:        remotePkgs,
		Checks:          remoteChecks,
	}

	jsonData, err := json.Marshal(remotePayload)
	if err != nil {
		return fmt.Errorf("error marshaling payload: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	
	// Add Agent Authentication Key (in production, use env var)
	apiKey := os.Getenv("HG_API_KEY")
	if apiKey == "" {
		apiKey = "hg_sk_live_v1_demo_key_9283"
	}
	req.Header.Set("x-api-key", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error sending POST request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("server returned non-OK status: %s", resp.Status)
	}

	Logger.Printf("    [+] Payload sent successfully to %s\n", url)
	return nil
}

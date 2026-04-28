package main

import (
	"fmt"
	"time"
)

const BackendURL = "http://localhost:5000/api/ingest"

func main() {
	fmt.Println("=========================================")
	fmt.Println("   Linux Security Agent starting...      ")
	fmt.Println("=========================================")

	for {
		fmt.Println("\n[+] Starting data collection cycle...")

		// 1. Collect Host Info
		hostInfo := CollectHostInfo()
		fmt.Printf("    Hostname: %s\n", hostInfo.Hostname)
		fmt.Printf("    OS: %s %s\n", hostInfo.OSName, hostInfo.OSVersion)

		// 2. Collect Installed Packages
		packages := CollectPackages()
		fmt.Printf("    Packages Found: %d\n", len(packages))

		// 3. Perform CIS Checks
		cisResults := PerformCISChecks()
		passed := 0
		for _, res := range cisResults {
			if res.Status == "PASS" {
				passed++
			}
		}
		fmt.Printf("    CIS Checks: %d passed / %d total\n", passed, len(cisResults))

		// 4. Send Payload
		err := SendPayload(BackendURL, hostInfo, packages, cisResults)
		if err != nil {
			fmt.Printf("    [!] Error sending payload: %v\n", err)
			fmt.Println("    [!] Retrying in 60 seconds...")
		}

		// Wait 60 seconds before next cycle
		time.Sleep(60 * time.Second)
	}
}

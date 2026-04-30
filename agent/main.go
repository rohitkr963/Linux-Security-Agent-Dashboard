package main

import (
	"time"
)

const BackendURL = "https://hostguard.duckdns.org/api/report"

func main() {
	InitLogger()
	Logger.Println("=========================================")
	Logger.Println("   Linux Security Agent starting...      ")
	Logger.Println("=========================================")

	// Payload Queue for Resilience
	var payloadQueue []Payload

	for {
		Logger.Println("\n[+] Starting data collection cycle...")

		// 1. Collect Host Info
		hostInfo := CollectHostInfo()
		Logger.Printf("    Hostname: %s\n", hostInfo.Hostname)
		Logger.Printf("    OS: %s %s\n", hostInfo.OSName, hostInfo.OSVersion)

		// 2. Collect Installed Packages
		packages := CollectPackages()
		Logger.Printf("    Packages Found: %d\n", len(packages))

		// 3. Perform CIS Checks
		cisResults := PerformCISChecks()
		passed := 0
		for _, res := range cisResults {
			if res.Status == "PASS" {
				passed++
			}
		}
		Logger.Printf("    CIS Checks: %d passed / %d total\n", passed, len(cisResults))

		// Construct Payload
		currentPayload := Payload{
			HostInfo:   hostInfo,
			Packages:   packages,
			CISResults: cisResults,
		}

		// Add current payload to queue
		payloadQueue = append(payloadQueue, currentPayload)

		// Try to send all payloads in the queue
		var failedQueue []Payload
		for _, payload := range payloadQueue {
			err := SendPayload(BackendURL, payload.HostInfo, payload.Packages, payload.CISResults)
			if err != nil {
				Logger.Printf("    [!] Error sending payload: %v\n", err)
				failedQueue = append(failedQueue, payload)
			}
		}

		// Update queue with only the failed ones (max size to prevent memory leak)
		if len(failedQueue) > 10 {
			Logger.Printf("    [!] Queue too large (%d). Dropping oldest payloads.\n", len(failedQueue))
			payloadQueue = failedQueue[len(failedQueue)-10:]
		} else {
			payloadQueue = failedQueue
		}

		if len(payloadQueue) > 0 {
			Logger.Printf("    [!] %d payloads queued for retry in 60 seconds...\n", len(payloadQueue))
		}

		// Wait 60 seconds before next cycle
		time.Sleep(60 * time.Second)
	}
}

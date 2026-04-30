package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type Payload struct {
	HostInfo   HostInfo    `json:"hostInfo"`
	Packages   []Package   `json:"packages"`
	CISResults []CISResult `json:"cisResults"`
}

func SendPayload(url string, hostInfo HostInfo, packages []Package, cisResults []CISResult) error {
	payload := Payload{
		HostInfo:   hostInfo,
		Packages:   packages,
		CISResults: cisResults,
	}

	jsonData, err := json.Marshal(payload)
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

	fmt.Printf("[%s] Payload sent successfully to %s\n", hostInfo.Timestamp, url)
	return nil
}

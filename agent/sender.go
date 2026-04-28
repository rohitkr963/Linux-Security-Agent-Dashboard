package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
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

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
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

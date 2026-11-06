---
title: "Security findings in an Anpviz IPC-D240W-S camera"
date: 2026-11-05T12:00:00Z
draft: false
description: "A documented look at stock camera firmware: confirmed behavior, static findings, and the limits of the evidence."
author: "Matt"
tags: ["Security", "Cameras", "Firmware", "Research"]
categories: ["Security"]
comments: false
---

**Research status, 5 November 2026 UTC.** I examined stock firmware for an Anpviz IPC-D240W-S after a password problem made my camera appear inaccessible. The tested unit ran V3.5.2.1 on SigmaStar Ifado hardware. I privately reported the findings to Anpviz beginning 17 October and submitted them to CISA/CERT/CC on 19 October (CISA case #116607; CERT/CC VRF #26-10-FZTVG). The disclosure date is under discussion; no coordinator-approved date or vendor fix is established in the records I have reviewed.

My two cameras now run replacement firmware. The live tests below were performed earlier, on my own stock-firmware unit while it was isolated from the internet. This page does not depict a new test on the replacement firmware.

![Evidence map: observed live behavior, static firmware findings, and unresolved impact](/images/anpviz-evidence-map.svg)

![Sanitized, typeset excerpts from the saved research record](/images/anpviz-evidence-excerpts.svg)

These graphics summarize preserved records; they are not screenshots of a running stock camera. I did not record a video of the October tests, and both cameras now run replacement firmware. A new live video would require restoring stock firmware on a test unit or obtaining another stock unit. The archived observations and firmware images are sufficient to explain the findings without doing that.

## What I observed on my camera

The strongest live result is a **conditional debug-to-root chain**. With a valid administrator credential, a legacy web action enabled a debug listener. Once enabled, that listener accepted a command that produced a shell running as root. The preserved test record includes this result from `/proc/self/status`:

```text
/opt/ch #
Uid: 0 0 0 0
```

The same record shows the debug service returned `return=0x00000000`. These are excerpts of observed output, not the command that opened the shell. I disabled the temporary services after the test. This does not show that the debug listener is open by default, or that an unauthenticated person can enable it. The service itself did not request a credential once enabled.

The boot update service also downloaded an unsigned, modified package offered over the local network. A later config-only package test caused a temporary loss of service; the camera returned after a power cycle with no demonstrated persistent change. **Download and interruption were observed; installation, takeover, and a persistent brick were not.**

The camera answered some ONVIF information requests without credentials. Its shipped configuration has authentication disabled for ONVIF and for two compatibility protocols. A browser capture showed a proposed account password sent in a cleartext HTTP request. Separately, the full form of a known password failed while its first 16 characters worked. The exact source of that length mismatch in V3.5.2.1 remains unknown.

## What the firmware shows

The stock configuration contains these authentication defaults (selected attributes only):

```xml
<StreamAccess enable_onvif="1" OnvifAuth="0" hik_auth="0" dh_auth="0" />
```

The older and live images also contain a shared root password hash. I have not recovered that password or demonstrated a default remote root login. The root-shell result above came through the enabled debug service, not through a password guess.

Static analysis found several unsafe memory copies in network-facing parsers. This selected line from a Ghidra decompilation of the UDP serial extractor shows the unbounded copy; its caller provides a fixed-size stack destination:

```c
if (value != NULL) strcpy(param_2, value);
```

Other short excerpts from the saved decompilation show the same class of problem in separate services:

```c
strcpy(acStack_350, pcVar3);       /* ONVIF handler */
strcpy(local_eb0, pcVar6 + 10);    /* Hikvision-compatible handler */
```

The variable names come from analysis, not vendor source code. These copies support out-of-bounds-write findings. They do **not** prove that a remote attacker can reach every path, crash the live service, or execute code. No live overflow or remote-code-execution test was performed for these findings.

The debug handler's saved analysis also shows a shell-command template equivalent to `echo %s > %s`; a separate network-setting path builds `ssn --ubootargs2 ethaddr "%s"`. These are firmware-side command excerpts, with no input values or request format. The first was confirmed as a command-execution sink after the debug service was enabled; the second remains conditional on an unvalidated setter path.

Other static findings include a deterministic recovery-credential path in older images, reversible storage of secondary service credentials with a shipped fixed key, and command construction that may be injectable if an unvalidated value can reach it. The recovery path was inactive in the flag state found on my unit; the command-injection setter path has not been confirmed. The firmware also contains a cloud update capability. I found no device-side update signature check in the reviewed path, but did not demonstrate acceptance of a malicious cloud update or any active misuse.

## Evidence levels matter

The working research report catalogs **24 findings and leads**, not 24 live exploits. The live debug-to-root chain is confirmed with its administrator precondition. The unsigned-package download, temporary interruption, selected unauthenticated ONVIF responses, HTTP password exposure, and password-prefix behavior were also observed. The memory-copy defects and many other paths were established by firmware analysis with the limits described above. Some reset-tool and authentication ideas remain leads because tests did not establish that the running camera accepted them.

Firmware tables contain roughly 24 OEM identifiers. They indicate that related products may exist, but do not identify 24 affected vendors or establish an installed-device count. I have asked the coordinator and vendor to determine the actual affected models and versions. I have no evidence that Anpviz or any government has exploited these weaknesses.

### Finding index

These IDs match my private working report. They are **not CVE identifiers**. “Static” means analysis of firmware or shipped defaults; “live” means an observation on my own stock camera. Where the two differ, the live evidence and later corrections take precedence.

| ID | Finding and evidence level | What remains open |
|---|---|---|
| F1 | Deterministic recovery credential branch in older images (static). | It was inactive in my unit's observed flag state; no live login was shown. |
| F2 | Debug-service parser overflow reproduced offline. | The service was gated; default live exposure was not shown. |
| F3 | Possible reset-verifier zero state (lead). | Runtime reachability and bypass are unconfirmed. |
| F4 | Serial-gated reset path in older images (static). | Live reset attempts produced no observed reset. |
| F5 | Broadcast reset calls in vendor tools (static). | Firmware acceptance and authorization are unknown. |
| F6 | Unsigned boot-service package download and temporary interruption (live). | Persistent installation was not demonstrated. |
| F7 | Longer password failed while its 16-character prefix worked (live). | The exact implementation and scope are unknown. |
| F8 | Password-change UI reported apparent success without a confirmed change; a test account later became inaccessible (live). | Server-side cause and final stored state are unknown. |
| F9 | Some symbols caused trouble when credentials were placed in an RTSP URL (observed). | This is not a demonstrated RTSP authentication bypass. |
| F10 | Account password inserted into XML without attribute escaping (live script). | Server-side XML injection or corruption was not demonstrated. |
| F11 | Proposed password transmitted over HTTP (live browser capture). | Replayability of other authentication values was not established. |
| F12 | ONVIF, HIK, and DAHUA authentication disabled in shipped defaults; some unauthenticated ONVIF responses observed live. | Exact operation access depends on runtime settings. |
| F13 | Reversible, fixed-key storage for secondary service credentials (static). | Exploitation requires access to a configuration or backup. |
| F14 | MAC/IP-based “tamper-proof” access control (static design). | It is a weak local access boundary, not a proved remote takeover. |
| F15 | Cloud update capability with no signature check found in the reviewed path (static). | Malicious update acceptance and active misuse were not demonstrated. |
| F16 | Older ONVIF URI builders include administrator credential-derived material (static). | Live reachability and token replay remain unconfirmed. |
| F17 | UDP control operations are gated partly by serial and flag state (static; live flag absent). | Live wire reachability and operation success remain unconfirmed. |
| F18 | Unescaped shell-command construction from a MAC value (static). | An attacker-controlled setter reaching that sink has not been established. |
| F19 | Same embedded root hash in three images; root UID observed via F23 (static and live). | No password recovery or default remote root login was demonstrated. |
| F20 | Unbounded copy in the UDP serial parser (static). | Live crash, code execution, and wire reachability untested. |
| F21 | Unbounded copies in ONVIF handlers (static). | Live crash or code execution untested. |
| F22 | Valid admin action enabled debug service and Telnet (live). | Default listener exposure was not shown. |
| F23 | Enabled debug service produced a root shell (live). | It depends on F22 or another way to enable that service. |
| F24 | Unbounded copy in the Hikvision-compatible parser of the live image (static). | The complete pre-auth network path and exploitation remain unverified. |

## What owners can do now

Avoid exposing stock camera services to the internet. Keep cameras on a restricted network, permit access only from the systems that need it, and enable protocol authentication where the interface allows it. Ask the seller for the exact model's security update and affected-version guidance. These steps reduce exposure; they cannot repair defects in the firmware.

## Disclosure timetable

I attempted a coordinated disclosure: I reported the findings privately, filed with CISA/CERT/CC, and proposed 26 January 2027 as a public date, 90 days after Anpviz acknowledged receiving my report on 28 October. I asked Anpviz for an initial technical assessment by 11 November. Its 4 November response referred me to an R&D address, but did not address the findings, affected models, or a remediation timetable. I regard the responses so far as deflection rather than substantive cooperation. As of 5 November, I have received no technical assessment or fix plan, and the January date has not been agreed with CERT/CC.

Because the findings include confirmed root access under a documented precondition, weak authentication defaults, and serious memory-safety concerns, I am seeking urgent coordination for earlier public disclosure. I am also concerned that advance notice of the weaknesses could be misused against buyers' devices by a party with privileged access to the firmware or cloud update channel, including the vendor. **I have no evidence that Anpviz has exploited customers' devices or intends to do so.** This is a risk I want the coordinator to assess, not an accusation or a finding of misconduct. The affected-product list and installed-device count remain unverified.

My website's vulnerability reporting policy asks researchers who find problems **in my assets** to give me at least 90 days. This research concerns another vendor's product. My earlier 90-day proposal to Anpviz was a proposed coordination period, and I will explain any change to the public date with the coordinator's position and the evidence available at publication time.

I will update this page with confirmed vendor, coordinator, and product-scope information as it becomes available.

**Evidence presentation.** This page uses short, sanitized excerpts. It omits device identifiers, credentials, raw configuration data, the command used in the debug test, and any package or request that could operate a vulnerable device. The original read-only capture and detailed records remain private for coordination and verification.

---
title: "openlens-fw"
description: "Hardened, open-source replacement firmware for the Anpviz IPC-D240W-S IP camera: your own build, signed with your own key, with no shared credentials and nothing that parses the network running as root."
lead: "Hardened, open-source replacement firmware for the Anpviz IPC-D240W-S IP camera."
draft: false
comments: false
type: "product"
cascade:
  type: "product"
  comments: false
docs: "https://docs.mlaify.io/openlens-fw/"
repo: "https://github.com/mlaify/openlens-fw"
---

{{< status "beta" >}}

The Anpviz IPC-D240W-S is an inexpensive PoE camera. Its stock firmware had
[24 published vulnerabilities](https://matthewd.xyz/writing/anpviz-camera-security/),
disclosed through CISA and CERT/CC in 2026, and the vendor stopped answering. openlens-fw
replaces that firmware's whole userland with a small one written for this camera: video,
RTSP, ONVIF, a web UI over HTTPS, day/night with IR, and signed updates, with nothing left of
the stock software but the kernel and the drivers it needs.

You build the image yourself, sign it with your own key, and install it on a camera you own.
It records to Synology Surveillance Station every day on the developer's cameras.

{{< cta url="https://docs.mlaify.io/openlens-fw/" variant="primary" label="Read the docs" >}}
{{< cta url="https://github.com/mlaify/openlens-fw" variant="ghost" label="View on GitHub" >}}

{{< callout type="warn" title="Replacing firmware can brick a camera" >}}
Installing takes a full flash backup with a CH341A programmer first, and a tested restore.
Only one camera model is supported: the Anpviz IPC-D240W-S on the SigmaStar Ifado SoC. Use it
at your own risk.
{{< /callout >}}

## What it does

{{< feature-grid cols="3" >}}

{{< feature icon="video" title="Video for your NVR" >}}
H.264 or H.265 main stream up to 2560x1440 and a sub-stream up to 1280x720, 30 fps. RTSP on 554, RTSPS on 322, ONVIF Profile S with motion events, and JPEG snapshots.
{{< /feature >}}

{{< feature icon="user-off" title="No shared credentials" >}}
An image holds no account, password or key, and the build fails if it finds one. You claim each camera after the install, in a 30-minute window after power-on, and get a one-time recovery code.
{{< /feature >}}

{{< feature icon="signature" title="Updates only you can sign" >}}
A camera installs only packages signed by keys in its own image, and you make those keys. An older version needs a package you signed as a downgrade on purpose. No vendor key, and no way for anyone else to push firmware to your cameras.
{{< /feature >}}

{{< feature icon="lock" title="HTTPS with its own CA" >}}
Each camera makes its own certificate authority, limited to your camera subnet, and issues its own certificate. You trust it once per computer. Its keys never leave the camera.
{{< /feature >}}

{{< feature icon="shield-half" title="Nothing on the network runs as root" >}}
RTSP, NTP, TLS and the web worker each run as their own user. Only a small monitor holds passwords and does privileged work, behind grants.
{{< /feature >}}

{{< feature icon="key" title="SSH done properly" >}}
Dropbear with keys only and post-quantum key exchange. No telnet, and no root login on the serial console.
{{< /feature >}}

{{< /feature-grid >}}

## How it works

The camera keeps its stock bootloader and kernel. openlens-fw replaces only the `rootfs`
partition with its own programs, which drive the SigmaStar video hardware through raw
ioctls instead of the vendor's media server. Settings, accounts and keys live on the data
partition and survive updates. [How it works](/openlens-fw/how-it-works/) has the parts and
the security design.

## What it leaves to you

- **Network isolation.** Surveillance Station can't use TLS with a generic ONVIF camera, so
  it talks plain RTSP and ONVIF (Digest logins, unencrypted video). Put the cameras on their
  own VLAN.
- **Physical protection.** The stock bootloader doesn't check signatures: anyone with a
  serial console or a flash clip can run any firmware.
- **Time.** NTP isn't authenticated; use a time server inside the camera network.

The [security model](https://docs.mlaify.io/openlens-fw/security-model/) lists each limit and
what to do about it.

## Links

- [mlaify/openlens-fw](https://github.com/mlaify/openlens-fw): source and issues. Our code is MIT; the stock files it runs on keep their own terms.
- [Documentation](https://docs.mlaify.io/openlens-fw/): build, sign, install, claim, and every setting.
- [The Anpviz research](https://matthewd.xyz/writing/anpviz-camera-security/) that started it.
- [Contributing](https://github.com/mlaify/openlens-fw/blob/main/CONTRIBUTING.md) · [Code of Conduct](https://github.com/mlaify/openlens-fw/blob/main/CODE_OF_CONDUCT.md) · [Security policy](https://github.com/mlaify/openlens-fw/blob/main/SECURITY.md)

openlens-fw is not affiliated with or endorsed by Anpviz, Anjoy or SigmaStar. "Anpviz" names
the hardware it runs on.

<!-- SPDX-License-Identifier: WTFPL -->

# Security Policy

## Supported versions

The `main` branch is supported.

## Reporting a vulnerability

Please open a private security advisory or contact the repository maintainers. Include reproduction steps, affected browser/version, and whether camera/model permissions are involved.

## Model safety

The app validates `safetensors` metadata only. It does not execute downloaded Python code, model repos, or arbitrary checkpoint logic.

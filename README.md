# Online KPM-2-CSV Converter

Convert Kaspersky Password Manager plain-text exports into import-ready CSV files directly in the browser. The converter supports four record groups:
- Website logins
- Application logins
- Other accounts
- Secure notes

## How to use

1. Export your credentials from Kaspersky Password Manager as plain text.
2. Open [app.gokdenizozkan.com/kpm2csv](https://app.gokdenizozkan.com/kpm2csv).
3. Choose the export file or drag it onto the page.
4. Review the detected categories and download only the CSV files you need.

## Privacy and safety

The app is a static site. Parsing happens entirely in the browser with no third-party scripts, so the exported credentials stay inside the local browser session.

## Why this exists

Kaspersky Password Manager exports to plain text, but that format is not directly importable by most password managers. Available solutions were either required installation, command line interface, or was closed source. This project aims to provide web based, secure, and open source solution for Kaspersky Password Manager users who seek to migrate their data to another product.

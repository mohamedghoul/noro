# Noro: The Productivity Intelligence Agent

> **AWS AI Agent Hackathon Project** - An AI-powered Chrome extension that tracks your work patterns, analyzes context with **Amazon Bedrock (Claude 4.5 Sonnet & Nova Pro)**, and provides intelligent productivity insights through AWS serverless infrastructure.

## Created by Team Get Noro Right Now

**Mohamed Ghoul** (Developer) - [GitHub](https://www.github.com/mohamedghoul) | [LinkedIn](https://www.linkedin.com/in/mohamedghoul)  
**Stephen Nguyen** (Developer) - [GitHub](https://github.com/ngstephen1) | [LinkedIn](https://www.linkedin.com/in/nguyenpn1)  
**Thuy Trang Cao** (Designer) - [GitHub](https://github.com/trngc) | [LinkedIn](https://www.linkedin.com/in/thuytrangcao)

---

## 🎯 What is Noro?

Noro is your AI-powered productivity assistant that watches how you work in Chrome, analyzes your patterns with AI, and helps you stay focused by suggesting what to do next. It tracks your tabs, documents, and work sessions to give you smart insights about your productivity.

### ✨ Key Features

- **🧠 AI-Powered Insights** - Automatically analyzes your work patterns using Amazon Bedrock (Claude 4.5 Sonnet & Nova Pro)
- **📊 Automatic Tracking** - Monitors your Chrome tabs and work sessions without manual input
- **🎯 Smart Suggestions** - AI suggests what to do next based on your work patterns
- **🔒 Privacy Controls** - Pause tracking, manual capture mode, and configurable data retention
- **⚡ Real-time Summaries** - Get instant insights on your productivity and focus areas

---

## 🏗️ Tech Stack

- **AI/LLM:** Amazon Bedrock (Claude 4.5 Sonnet, Nova Pro)
- **Compute:** AWS Lambda (Python 3.11)
- **API:** Amazon API Gateway (HTTP API) with CORS & x-api-key auth
- **Storage:** Amazon DynamoDB (single-table design)
- **Security:** AWS WAF v2, CloudWatch, IAM (least-privilege)
- **Client:** Chrome Extension (Manifest V3)

---

## 🚀 Quick Installation & Testing

### Prerequisites

- **Chrome Browser** (any recent version)
- **Node.js 14.0.0+** and npm (for development)
- **AWS Account** with API Gateway and Bedrock access

### Installation (End Users)

1. **Download** the extension from [GitHub Releases](https://github.com/mohamedghoul/noro/releases/tag/0.1.0)
2. **Extract** `noro-extension-v0.1.0.zip` to a folder
3. **Open Chrome** and navigate to `chrome://extensions/`
4. **Enable** "Developer mode" (toggle in top right)
5. **Click** "Load unpacked" and select the extracted folder
6. **Pin** the Noro icon to your toolbar for easy access

### Development Setup

```bash
# Clone the repository
git clone https://github.com/mohamedghoul/noro.git
cd noro/extension

# Install dependencies
npm install

# Configure AWS credentials (IMPORTANT: Never commit this file!)
cp src/config.template.ts src/config.ts
# Edit config.ts with your AWS API credentials

# Build the extension
npm run build

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the noro/extension directory
```

---

## 🧪 Testing the Application

### Backend API Configuration

Set up your environment variables:

```bash
export AWS_PROFILE=your-aws-profile
export AWS_REGION=us-east-1
export API_ID=your-api-gateway-id
export API_URL="https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com/prod"
export PIA_API_KEY=your-api-key
```

### API Endpoints

- **GET** `/health` - Health check & DynamoDB status
- **POST** `/context` - Ingest work session snapshot (tabs + screenshots)
- **GET** `/insights?user_id={id}&limit={N}` - Retrieve recent insights

**Authentication:** Include header `x-api-key: {PIA_API_KEY}`  
**CORS:** Enabled for all origins (*)  
**Rate Limiting:** Burst 10, Rate 5 req/sec

### Test 1: Health Check

```bash
curl -sS -H "x-api-key: $PIA_API_KEY" "$API_URL/health" | jq .
```

### Test 2: Submit Context

```bash
cat >/tmp/context.json <<'JSON'
{
  "correlation_id": "c-demo-1",
  "user_id": "test-user",
  "ts": "2025-10-22T12:00:00Z",
  "event": "manual_capture",
  "active_app": "chrome",
  "active_url_hash": "abcd1234",
  "tabs": [
    {
      "title": "Project plan – Google Docs",
      "url_hash": "abcd1234",
      "text_sample": "Working on project documentation"
    }
  ],
  "signals": {"idle_sec": 0},
  "privacy": {"redacted": true}
}
JSON

curl -sS -H "x-api-key: $PIA_API_KEY" \
  -H "content-type: application/json" \
  --data-binary @/tmp/context.json \
  "$API_URL/context" | jq .
```

### Test 3: Retrieve Insights

```bash
curl -sS -H "x-api-key: $PIA_API_KEY" \
  "$API_URL/insights?user_id=test-user&limit=5" | jq .
```

---

## 📋 Extension Integration Example

```javascript
const BASE_URL = "YOUR_API_GATEWAY_URL";
const API_KEY = "YOUR_API_KEY";
const userId = "user-id";

// Send work session snapshot
async function sendContext(payload) {
  await fetch(`${BASE_URL}/context`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify(payload)
  });
}

// Poll insights every 30 seconds
setInterval(async () => {
  const res = await fetch(`${BASE_URL}/insights?user_id=${userId}&limit=5`, {
    headers: { "x-api-key": API_KEY }
  });
  const data = await res.json();
  // Render data.items in the popup
}, 30000);
```

---

## 🛠️ Development & Build

### Creating a Release

```bash
cd extension
npm run release
# Creates noro-extension-release.zip for distribution
```

### Lambda Environment Variables

```bash
DDB_TABLE=your-dynamodb-table
USE_BEDROCK=true
BEDROCK_REGION=us-east-1
BEDROCK_MODEL=anthropic.claude-4.5-sonnet
ANALYTICS_MODEL=amazon.nova-pro
USE_TEXTRACT=true
API_KEY=your-api-key
```

---

## 🔒 Privacy & Security

### What Noro Tracks

- Websites you visit (to understand work context)
- Time spent on different tasks
- Tab information (titles, URLs)
- Activity and idle time

### What Noro Does NOT Track

- Passwords or personal information
- Private browsing (incognito mode)
- Non-work browsing (when paused)
- Detailed content of private documents

### Your Controls

- **Pause Anytime** - Stop all tracking with one click
- **Data Retention** - Choose retention period (3-30 days)
- **Manual Mode** - Only track when you explicitly choose
- **Local Config** - Credentials never committed to version control

---

## 📂 Project Structure

```
noro/
├── extension/              # Chrome extension (TypeScript)
│   ├── src/               # Source files
│   ├── dist/              # Compiled output
│   ├── public/            # Assets and icons
│   └── manifest.json      # Extension manifest
├── backend/               # AWS Lambda functions
│   ├── common/            # Shared utilities
│   ├── lambdas/           # Lambda handlers
│   └── dev_api/           # Local dev server
├── infra/                 # CDK infrastructure
└── layers/                # Lambda layers
```

---

## 📊 Monitoring & Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/pia-ingest-context --since 15m --follow
aws logs tail /aws/lambda/pia-get-insights --since 15m --follow
aws logs tail /aws/lambda/pia-health --since 15m --follow

# Find Bedrock model IDs
aws bedrock list-foundation-models --region us-east-1 \
  --query "modelSummaries[?contains(modelName,'Claude') || contains(modelName,'Nova')].[modelName,modelId]" \
  --output table
```

---

## 🔧 Troubleshooting

### Extension Issues

- **"Cannot find module './config.js'"** - Create `config.ts` from template
- **"API calls failing with 403"** - Verify API key is correct
- **"config.ts appears in git status"** - Ensure `.gitignore` includes it
- **Extension not loading** - Run `npm run build` and reload extension

### API Issues

- **403 Forbidden** - Check `x-api-key` header matches Lambda `API_KEY` env var
- **Decimal errors** - Backend converts floats to Decimal for DynamoDB
- **Import errors** - Ensure `pia_common` module is packaged in Lambda

### Platform-Specific

The build script works on Windows (PowerShell/bash), macOS, and Linux. If you encounter platform issues, ensure Node.js 14+ is installed.

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/mohamedghoul/noro/issues)
- **Documentation:** This README
- **AWS Resources:** [Bedrock Docs](https://docs.aws.amazon.com/bedrock/) | [API Gateway Docs](https://docs.aws.amazon.com/apigateway/)

---

## 📄 License

This project was created for the AWS AI Agent Hackathon.

---

**Noro** - Making every workday more focused and productive 🚀

# About this repo
* Maintainer: Chris Stone (chstone@microsoft.com)
* Project: Call-Center Automation (Solution How-to Guide)
* Use case: Provide an Interactive Voice Response (IVR) bot to process product orders for a fictious company that sells bicycles and bicycle accessories.

## Platforms
* [Bot Framework](https://docs.botframework.com/en-us/skype/calling/) with [Skype Calling](https://docs.botframework.com/en-us/skype/calling/) channel  
Routes calls to the bot
* [Bing Speech Service](https://docs.microsoft.com/en-us/azure/cognitive-services/speech/home)  
Processes speech-to-text
* [LUIS](https://www.luis.ai/) (Language Understanding Intelligent Service)  
Extracts intent and entities from text
* [Azure Search](https://docs.microsoft.com/en-us/azure/search/)  
Indexes the product catalog for product-query matching
* [Azure SQL](https://docs.microsoft.com/en-us/azure/sql-database/)  
Stores product and order data
* [DocumentDB](https://docs.microsoft.com/en-us/azure/documentdb/)  
Stores bot state and event logs
* [Azure Storage](https://docs.microsoft.com/en-us/azure/storage/)  
Stores bot audio data for debugging
* [Azure App Services](https://docs.microsoft.com/en-us/azure/app-service/)  
Hosts the bot application

# Build
> Build environment should have the latest NodeJS runtime. Recommended v7.2 or newer.

From the root of this repo:
1. `npm install`
1. `npm run build`
1. Copy `package.json`, `web.config`, and `data` to `dist`
1. `cd dist`
1. `npm install --production`

## Test
To run unit tests, run `npm test`

# Deployment

> For automated ARM deployment, see the end of this section

## Deploy Azure Resources
Create the following resources using the [Azure Portal](https://portal.azure.com/), [PowerShell](https://docs.microsoft.com/en-us/powershell/azure/install-azurerm-ps?view=azurermps-3.8.0), or [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).
> Unless otherwise noted, use any configuration and scale parameters you like
* Azure Storage
* DocumentDB (*without* Mongo)
* Azure SQL (*with* AdventureWorksLT sample DB)
* Azure Search
* Azure App Service
* Bing Speech API key
* Language Understanding Intelligent Service (LUIS) key

## Configure Azure Resources

### Register your bot
1. Register a new bot at the [Bot Framework Portal](https://dev.botframework.com/bots/new)
1. Create a new Microsoft App, and make note of its **ID** and **Secret**
1. Leave the messaging endpoint blank for now
1. After your bot is registered, click through to its Skype Channel and ensure that **Skype Calling is enabled**. Your calling endpoint is `https://YOUR_WEB_APP.azurewebsites.net/api/calling`

### Find your LUIS programmatic key
1. Log in to the [LUIS Portal](https://www.luis.ai/)
1. Navigate to the `My Keys` tab
1. Make a note of your `Programmatic API Key`

### Azure App Service Application Settings
Create the following application settings on your Web App:
> Learn how to configure a site's [App Settings](https://docs.microsoft.com/en-us/azure/app-service-web/web-sites-configure) using the Azure Portal
> 
> You can find all resource keys and names using the Azure Portal, with the exception of the LUIS Programmatic Key, which must be copied from the [LUIS Portal](https://www.luis.ai/).

| NAME | VALUE |
| ---- | ----- |
| WEBSITE_NODE_DEFAULT_VERSION | 7.7.4 |
| CALLBACK_URL | https://**YOUR_WEB_APP**.azurewebsites.net/api/calls |
| MICROSOFT_APP_ID | **YOUR_APP_ID** (GUID) |
| MICROSOFT_APP_PASSWORD | **YOUR_APP_SECRET** |
| LUIS_REGION | westus (or your region, if different) |
| LUIS_KEY | **YOUR_LUIS_KEY** |
| LUIS_MANAGER_KEY | **YOUR_LUIS_PROGRAMATIC_KEY** |
| LUIS_APP_ID | (empty) |
| SPEECH_KEY | **YOUR_SPEECH_KEY** |
| SPEECH_ENDPOINT | https://speech.platform.bing.com/recognize |
| SPEECH_REGION | (empty) |
| SEARCH_SERVICE | **YOUR_SEARCH_ACCOUNT** |
| SEARCH_KEY | **YOUR_SEARCH_KEY** |
| BLOB_ACCOUNT | **YOUR_STORAGE_ACCOUNT** |
| BLOB_KEY | **YOUR_STORAGE_ACCOUNT_KEY** |
| DDB_URL | https://**YOUR_DOCUMENTDB_ACCOUNT**.documents.azure.com:443/ |
| DDB_KEY | **YOUR_DOCUMENTDB_KEY** |
| SQL_HOST | **YOUR_AZURE_SQL_HOST** |
| SQL_USER | **YOUR_AZURE_SQL_USER** |
| SQL_PASSWORD | **YOUR_AZURE_SQL_PASSWORD** |
| SQL_DATABASE | **YOUR_AZURE_SQL_DATABASE** |
| LOG_BLOB_CONTAINER | bot-audio |
| LOG_DDB_DATABASE | bot-data |
| LOG_DDB_COLLECTION | bot-logs |
| STORE_DDB_DATABASE | bot-data |
| STORE_DDB_COLLECTION | bot-sessions |

### Deploy bot to Azure App Service
After building the project (see above), upload the contents of `dist` to your App Service
> Learn how to upload files to a web app using [FTP and PowerShell](https://docs.microsoft.com/en-us/azure/app-service-web/scripts/app-service-powershell-deploy-ftp)

## Automated ARM Deployment
To automatically create, configure, and deploy all Azure resources at once, run the following commands in PowerShell (or use your favorite ARM deployment tool):
> You will be prompted for **four** configuration parameters. See manual notes above if you need help finding the correct values.
```PowerShell
$rg = "call-center"
$loc = "eastus"
New-AzureRmResourceGroup $rg $loc
New-AzureRmResourceGroupDeployment -Name CallCenterSolution -ResourceGroupName $rg -TemplateFile .\azuredeploy.json
```

# Usage
Before talking to your bot, you must add it to your Skype contacts list. You can find a link to add your bot to Skype on the [Bot Portal](https://dev.botframework.com/) under the channel listing.

> Directly add the bot to your contacts: https://join.skype.com/bot/**YOUR_APP_ID**

Using your Skype client, initiate a call to your bot and follow the prompts. You can order any product in the standard adventure works category, such as a mountain bike, fenders, or bike wash. The bot will prompt you to disambiguate product names or to choose product attributes, if necessary.

## Sample product queries
1. "mountain bike": general product category
1. "what is mountain 500?": get more information about a specific product
1. "mountain 500": specific product
1. "mountain 500 in silver": specific product with specific color
1. "bicycle for road use"
1. "extra large jersey": general product category with specific size

# Scale
A basic deployment will scale to around 10 concurrent requests per second. Each layer of the architecture supports a separate level of concurrency, but the entire solution is bound by the narrowest pipeline of all the services. Services may be scaled **up** to support higher throughput per resource, or scaled **out** to spread throughput across multiple resources.

| SERVICE | MAX RPS PER INSTANCE | SCALE UP | SCALE OUT |
| ------- | ------------ | -------- | --------- |
| LUIS | 10 | N/A | Custom account partitioning |
| Bing Speech | 20 | N/A | Custom account partitioning |
| App Service | 100s | Add RAM/cores | Add instances |
| Search | ~60 | N/A | Add replicas |
| DocumentDB | ~10K | N/A | Add partitioning |
| Blobs | ~20K | N/A | N/A |

> **CUSTOM ACCOUNT PARTITIONING**: Per-service scale-out configuration of Bing Speech and LUIS is not available, so custom sharding/partitioning of Bing Speech and LUIS APIs must be implemented in order to distribute load between multiple accounts. In order to achieve this, either implement a round-robin state-tracker within the bot app, or apply hash-based routing from the caller's userID.

# Customization
High level guide to making changes

## Data Wrangling
Source content is not often in an ideal raw state for consumption by bots and search applications.
This section will use the sample AventureWorks dataset to describe common preprocessing transformation steps that can be applied to source content.

## Synonym Mapping
TBD
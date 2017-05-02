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
1. Your messaging endpoint is `https://YOUR_WEB_APP.azurewebsites.net/api/messages`
1. After your bot is registered, click through to its Skype Channel and ensure that **Skype Calling is enabled**. Your calling endpoint is `https://YOUR_WEB_APP.azurewebsites.net/api/calling`

### Deploy LUIS Model
1. Log in to the [LUIS Portal](https://www.luis.ai/)
1. Import an app using the GUI. The pre-configured LUIS app can be found in this repo at `/data/luis/AdventureWorks.json`
1. Using the LUIS Portal, **train** the application
1. Using the LUIS Portal, assign the **LUIS key** you create earlier
1. Using the LUIS Portal, **publish** the application
1. Make note of the published **endpoint** URL

### Azure SQL configuration
Execute the following scripts, available under `/data/sql`.

> Use [SQL Server Management Studio](https://docs.microsoft.com/en-us/sql/ssms/use-sql-server-management-studio) to connect to your Azure SQL database and execute the following scripts.

1. `functions/ufnGetCategory.sql`
1. `functions/ufnGetColorsJson.sql`
1. `functions/ufnGetDescription.sql`
1. `functions/ufnGetProductAttributes.sql`
1. `functions/ufnGetSizesJson.sql`
1. `functions/ufnIsDeleted.sql`
1. `views/vProductsForSearch.sql`

### Azure Search configuration
> Use your favorite REST client to create search resources using the [Azure Search REST API](https://docs.microsoft.com/en-us/rest/api/searchservice/create-data-source).
1. Create a new **search index** on your Search Account using the schema definition at `/data/search/schema.json`
1. Copy your Azure SQL **connection string** to `/data/search/datasource.json`
1. Create a new **search datasource** on your Search Account using the datasource definition at `/data/search/datasource.json`
1. Create a new **search indexer** on your Search Account using the indexer definition at `/data/search/indexer.json`
1. Run the indexer at least once to populate the index

### Azure App Service Application Settings
Create the following application settings on your Web App:
> Learn how to configure a site's [App Settings](https://docs.microsoft.com/en-us/azure/app-service-web/web-sites-configure) using the Azure Portal

| NAME | VALUE |
| ---- | ----- |
| WEBSITE_NODE_DEFAULT_VERSION | 7.7.4 |
| CALLBACK_URL | https://**YOUR_WEB_APP**.azurewebsites.net/api/calls |
| MICROSOFT_APP_ID | **YOUR_APP_ID** (GUID) |
| MICROSOFT_APP_PASSWORD | **YOUR_APP_SECRET** |
| LUIS_REGION | westus (or your region, if different) |
| LUIS_KEY | **YOUR_LUIS_KEY** |
| LUIS_MANAGEMENT_KEY | **YOUR_LUIS_PROGRAMATIC_KEY** |
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

> Or [enable the App Service app repository](https://docs.microsoft.com/en-us/azure/app-service-web/app-service-deploy-local-git#a-namestep3astep-3-enable-the-app-service-app-repository) for continous-integration deployment. If you opt for app-repo CI, be sure to either change the root app directory from `site\wwwroot` to `site\wwwroot\dist` (under App Settings in the Portal) or change the value of `outDir` in tsconfig.json to an empty string (and be sure to commit tsconfig.json back to your local git repo before pushing to Azure).

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
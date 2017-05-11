# About this repo
* Maintainer: Chris Stone (chstone@microsoft.com)
* Project: Call-Center Automation (Solution How-to Guide)
* Use case: Provide an Interactive Voice Response (IVR) bot to process product orders for a fictitious company that sells bicycles and bicycle accessories.

## Table of Contents

<!-- toc -->
- [Architecture](#architecture)
- [Build](#build)
- [Manual Deployment](#manual-deployment)
  * [Deploy Azure Resources](#deploy-azure-resources)
  * [Configure Azure Resources](#configure-azure-resources)
- [Automated Deployment](#automated-deployment)
- [Usage](#usage)
- [Scaling](#scaling)
- [Customization](#customization)
  * [Identify custom entities (LUIS)](#identify-custom-entities-luis)
  * [Using entities with search (LUIS & Azure Search)](#using-entities-with-search-luis--azure-search)
  * [Identify common synonyms (Azure Search)](#identify-common-synonyms-azure-search)
  * [Data Wrangling (SQL Server)](#data-wrangling-sql-server)
- [Copyright](#copyright)
- [License](#license)
<!-- tocstop -->

# Architecture
![architecture][IMG1]

* [Skype Client][1]  
User initiates call
* [Bot Connector][2] + [Skype Calling Channel][3]   
Routes calls from Skype to the bot
* [Azure App Services][10]  
Hosts the bot application, which manages logic and API calls
* [Cosmos DB][8]  
Stores bot state and event logs
* [Bing Speech Service][4]    
Processes speech-to-text
* [LUIS][5] (Language Understanding Intelligent Service)  
Extracts intent and entities from text
* [Azure Search][6]  
Indexes the product catalog for product-query matching
* [Azure SQL][7]  
Stores product and order data
* [Azure Storage][9]  
Stores bot audio data for debugging

# Build
This project is built using TypeScript. Your environment should have the ["current" NodeJS runtime][11] in order to build the project.

> If you are only interested in **[automated deployment](#automated-deployment)**, you may skip this section.

After cloning this repo, run the following shell commands from the repo root:
1. `npm install`
1. `npm run build`
1. Copy `./package.json`, `./web.config`, `./src/bot-settings.json`, and `./data` to `./dist`
1. `cd dist`
1. `npm install --production`

# Manual Deployment
> If you are only interested in **[automated deployment](#automated-deployment)**, you may skip this section.

## Deploy Azure Resources
Create the following resources using the [Azure Portal][12], [PowerShell][13], or [Azure CLI][14].
> Unless otherwise noted, use any configuration and scale parameters you like
* `Azure Storage`
* `Cosmos DB` (*with* SQL / DocumentDB API)
* `Azure SQL` (*with* AdventureWorksLT sample DB)
* `Azure Search`
* `Azure App Service`
* `Cognitive Service` keys:
  * Key for `Bing Speech API`
  * Key for `Language Understanding Intelligent Service (LUIS)`

## Configure Azure Resources

### Register your bot
> See guided screenshots for [bot registration][REL1] and [enabling Skype Calling][REL2]

1. Register a new bot at the [Bot Framework Portal][15]
1. Create a new Microsoft App, and make note of its **ID** and **Secret**
1. Leave the messaging endpoint blank for now
1. After your bot is registered, click through to its Skype Channel and ensure that **Skype Calling is enabled**. Your calling endpoint is `https://YOUR_WEB_APP.azurewebsites.net/api/calling`


### Find your LUIS programmatic key
> See guided screenshots for finding the [LUIS programmatic key][REL3]

1. Log in to the [LUIS Portal][16]
1. Navigate to the `My Keys` tab
1. Make a note of your `Programmatic API Key`


### Azure App Service Application Settings
Create the following application settings on your Web App:
> Learn how to configure a site's [App Settings][17] using the Azure Portal
> 
> You can find all required resource keys and names (below, in **bold**) using the Azure Portal, with the exception of the LUIS Programmatic Key, which must be copied from the [LUIS Portal][16].

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
| DDB_URL | https://**YOUR_COSMOS_DB_ACCOUNT**.documents.azure.com:443/ |
| DDB_KEY | **YOUR_COSMOS_DB_KEY** |
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
After building the project (see [build](#build)), upload the contents of `dist` to your App Service
> Learn how to upload files to a web app using [FTP and PowerShell][18]
>
> You can also deploy from the command line using [WebDeploy][19]

# Automated ARM Deployment
To automatically create, configure, and deploy all Azure resources at once, run the following commands in PowerShell (or use your favorite ARM deployment tool):
> You will be prompted for **three** configuration parameters. See the [Bot Registration Guide][REL1] and the [LUIS Programmatic-Key Guide][REL3] if you need help finding these values.
```PowerShell
$rg = "call-center"
$loc = "eastus"
New-AzureRmResourceGroup $rg $loc
New-AzureRmResourceGroupDeployment -Name CallCenterSolution -ResourceGroupName $rg -TemplateFile .\azuredeploy.json
```

# Usage
You will use the [Skype Client][20] to initiate calls to your bot (*Skype for Business is not current supported*).

> **Windows Users** may use the [App Store Client][21]

Before talking to your bot, you must add it to your Skype contacts list. You can find a link to add your bot to Skype on the [Bot Portal][2] under the channel listing.

> Directly add the bot to your contacts: https://join.skype.com/bot/YOUR_APP_ID

Using your Skype client, initiate a call to your bot and follow the prompts. You can order any product in the standard adventure works category, such as a mountain bike, fenders, or bike wash. The bot will prompt you to disambiguate product names or to choose product attributes, if necessary.

## Sample product queries
1. "mountain bike": general product category
1. "what is mountain 500?": get more information about a specific product
1. "mountain 500": specific product
1. "mountain 500 in silver": specific product with specific color
1. "bicycle for road use"
1. "extra large jersey": general product category with specific size

# Scaling
A basic deployment will scale to around 10 concurrent requests per second. Each layer of the architecture supports a separate level of concurrency, but the entire solution is bound by the narrowest pipeline of all the services. Services may be scaled **up** to support higher throughput per resource, or scaled **out** to spread throughput across multiple resources.

| SERVICE | MAX RPS PER INSTANCE | SCALE UP | SCALE OUT |
| ------- | ------------ | -------- | --------- |
| LUIS | 10 | N/A | Custom account partitioning |
| Bing Speech | 20 | N/A | Custom account partitioning |
| App Service | 100s | Add RAM/cores | Add instances |
| Search | ~60 | N/A | Add replicas |
| Cosmos DB (DocumentDB) | ~10K | N/A | Add partitioning |
| Blobs | ~20K | N/A | N/A |

> **CUSTOM ACCOUNT PARTITIONING**: Scale-out of Bing Speech and LUIS is not currently available. If your scaling needs exceed 10 requests per second, you can implement a custom load balancing scheme across multiple service endpoints.
>
> E.g. to double the capacity of LUIS, create a second LUIS application using the same JSON configuration as the first. Then modify your bot to perform round-robin (alternating) queries to each service.

# Customization
This bot is tuned end-to-end to work specifically with the AdventureWorks sample product database. In order to transition to a custom data set, some consideration must be taken to account for the format and structure of your custom data and how best to apply best practices for LUIS and Azure Search.

## Identify custom entities (LUIS)
Every domain has its own set of common entities. An entity represents a class of similar objects that are detected from raw text by LUIS. There are three main types of entities: **prebuilt** (cross-domain, provided by Bing), **custom** (learned from your labeled data), and **closed-list** (a static set of terms chosen by you). This app uses only closed-list entities across four classes: `color`, `category`, `sex`, and `size`.

Your goal when building and training custom entities should be to identify object classes that can be used by the search engine to boost results for the specified class.

## Using entities with search (LUIS & Azure Search)
There are two approaches to using entities with search: `filtering` and `boosting`. By applying a filter, you eliminate results that do not match the entity metadata. By applying a boost, you surface matching entities to the top of the result set, but you also return non-matches, albeit with a lower score. 

Use a `filter` when the entity represents a broad or unambiguous category or if the utterance is comprised *soley* of entities. E.g.:
```
"bicycle"     // "bicycle is a category entity
"clothing"    // "clothing" is a category entity
"red bicycle" // "red" is a color entity; "bicycle" is a category entity)
```

Use a `boost` when the entity is included with other terms. E.g.:
```
"mountain bicycle" // a category->bicycle would be ok here
"bicycle rack"     // but not here. "bicycle racks" are in the accessories category; not bicycles
```

Apply a search filter to return only matches for `red bicycle` where the color field is `red`:
```
<url>?search=red bicycle&$filter=colors/any(x: x eq 'red')
```

Or apply a boost to raise the score for the same results from the filtered query (typically bringing matches to the top of the result set) *while still including other colors as well* (e.g. if `red` was not available):
```
<url>?red bicycle colors:red^2
```

> Learn more about [advanced query operators in Azure Search][22]

## Identify common synonyms (Azure Search)
Use custom analyzers in Azure Search to enable content matching against domain-specific synonyms, or to map between a product's written form and its spoken form. For instance, product sizes are represented in the database as `S`, `M`, `L`, and `XL`, however, when speaking, we refer to `small`, `medium`, `large`, and `extra large`. Use one or more `#Microsoft.Azure.Search.SynonymTokenFilter`s to enable matching between these different forms.

> Learn more about [creating custom analyzers in Azure Search][23]

This app uses three synonym groups to map both between language variants (hat/cap) and representational variants (S/small):

### Size
```JSON
[
  "S,small",
  "M,medium",
  "XL,extra large",
  "L,large"
]
```

### Product
```JSON
[
  "bike=>bicycle",
  "lady,girl=>woman",
  "guy,boy=>man",
  "clothes=>clothing",
  "hat=>cap"
]
```

### Sex
```JSON
[
  "lady,girl=>woman",
  "guy,boy=>man"
]
```

> Azure Search now supports [query-time synonym maps in public preview][24].

## Data Wrangling (SQL Server)
Source content (SQL tables, raw files, etc.) often is not in an ideal state for consumption by bots and search applications.
This section describes common preprocessing transformations that can be applied to source content. In this case, the source content is an Azure SQL database containing a handful of tables describing a product catalog.

### Connect to a Table or a View?
Azure Search offers a configurable `Azure SQL indexer` for no-code, automated ingest of your source content, given the name of a `table` or `view` in your database. For simple data sets, a `table` works well, but for most applications, you will want to connect to a custom `view` to account for SQL joins, predicates, and other custom result processing.
> Learn more about connecting [Azure Search and Azure SQL][25]

### Defining a search "document"
Search documents, by nature, are denormalized (unjoined). Azure Search does not support joins, so all of the information describing a result must be attached to a single document. 

To achieve a high level of performance and usability, it is critical to apply a proper denormalization strategy against your normalized (table-joined) data. A common mistake is to simply map each row of a single table to a corresponding search document. For data structures like a product catalog that are highly normalized, this can often lead to "noisy" data, or the reverse effect, information loss.

Consider the following two AdventureWorks tables. Both contain product names, but the latter has many repeated sections, varying only by a single attribute.

#### SalesLT.ProductModel
| Name |
| ---- |
| HL Road Frame |
| LL Road Frame |
| ML Road Frame |
| ML Road Frame-W |

#### SalesLT.Product
| Name |
| ---- |
| HL Road Frame - Black, 44 |
| HL Road Frame - Black, 48 |
| HL Road Frame - Black, 52 |
| HL Road Frame - Black, 58 |
| HL Road Frame - Black, 62 |
| HL Road Frame - Red, 44 |
| HL Road Frame - Red, 48 |
| HL Road Frame - Red, 52 |
| HL Road Frame - Red, 56 |
| HL Road Frame - Red, 58 |
| HL Road Frame - Red, 62 |
| ... and so on, for LL, ML, and ML-W, etc. |

If we envision each row as a search result, the second table is quickly overwhelmed with near-duplicate results, leading to a poor user experience. However, the first table lacks valuable product information needed to identify a specific product SKU.

The solution is to **collapse** the information from the second table onto the first using a custom `view` and a handful of `user-defined functions`.

> Other ETL techniques may be used to massage your content. This example uses functions.
>
> See the [custom view][REL4] used by this solution.

Azure Search supports the `Collection(Edm.String)` document type for storing semi-complex, searchable metadata on a document. In this case, we will define two collections: one for `color` and one for `size`. Both of these product attributes should be searchable, but, because they are attached to a parent document, they will not return a new document for every possible combination. The ideal search document looks like:

```JSON
{
  "productModelId": "26",
  "modifiedDate": "2006-06-01T00:00:00Z",
  "name": "Road-250",
  "category": ["bikes", "road bikes"],
  "colors": ["black", "red"],
  "sizes": ["44", "48", "52", "58"],
  "sex": "Unisex",
  "maxStandardCost": 1554.9479,
  "minStandardCost": 1518.7864,
  "maxListPrice": 2443.35,
  "minListPrice": 2443.35,
  "products": "<serialized-json-here>",
  "description_HE": "<hebrew-text-here>",
  "description_ZH_CHT": "<chinese-text-here>",
  "description_EN": "<english-text-here>",
  "description_AR": "<arabic-text-here>",
  "description_TH": "<thai-text-here>",
  "description_FR": "<french-text-here>"
}
```

In order to properly prepare the values for Azure Search, we must coerce them into a JSON string. As of this writing, there is no built-in SQL functionality to achieve this, but we can apply the SQL `coalesce` operator inside a custom function to build the string:
```sql
CREATE FUNCTION ufnGetColorsJson(@productModelId int)
RETURNS nvarchar(max)
AS 
BEGIN
  DECLARE @vals AS nvarchar(max)
  SELECT
    @vals = coalesce(@vals + ',"', '"') + [t].[color] + '"'
  FROM
    (
      SELECT
        DISTINCT [color]
      FROM
        [SalesLt].[Product] [p]
      WHERE
        [p].[productModelId]=@productModelId
    ) [t]
  RETURN lower('[' + @vals + ']')
END
```

Then we create a new `view` to return the denormalized representation of our data:
```sql
CREATE VIEW [SalesLT].[vProductsForSearch]
AS
SELECT
  [pm].[name],
  [pm].[productModelId],
  [pm].[modifiedDate],
  (SELECT dbo.ufnGetColorsJson([productModelId])) [colors],
  (SELECT dbo.ufnGetSizesJson([productModelId])) [sizes]
FROM
  [SalesLt].[ProductModel] [pm]
```

> See the full view with more custom functions in this repo under `./data/sql`

Azure Search executes this view when it indexes (and periodically re-indexes) the product database.

# Copyright
©2017 Microsoft Corporation. All rights reserved. This information is provided "as-is" and may change without notice. Microsoft makes no warranties, express or implied, with respect to the information provided here. Third party data was used to generate the solution. You are responsible for respecting the rights of others, including procuring and complying with relevant licenses in order to create similar datasets.

# License
The MIT License (MIT)
Copyright (c) 2017 Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[IMG1]: ./docs/img/arch.png
[REL1]: ./docs/Bot-Registration.md
[REL2]: ./docs/Enable-Skype-Calling.md
[REL3]: ./docs/LUIS-Programmatic-Key.md
[REL4]: ./data/sql/views/vProductsForSearch.sql
[1]: https://www.skype.com/
[2]: https://dev.botframework.com/
[3]: https://dev.skype.com/bots
[4]: https://docs.microsoft.com/en-us/azure/cognitive-services/speech/home
[5]: https://docs.microsoft.com/en-us/azure/cognitive-services/LUIS/Home
[6]: https://docs.microsoft.com/en-us/azure/search/
[7]: https://docs.microsoft.com/en-us/azure/sql-database/
[8]: https://docs.microsoft.com/en-us/azure/cosmos-db/
[9]: https://docs.microsoft.com/en-us/azure/storage/
[10]: https://docs.microsoft.com/en-us/azure/app-service/
[11]: https://nodejs.org/en/download/current/
[12]: https://portal.azure.com/
[13]: https://docs.microsoft.com/en-us/powershell/azure/install-azurerm-ps?view=azurermps-3.8.0
[14]: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
[15]: https://dev.botframework.com/bots/new
[16]: https://www.luis.ai/
[17]: https://docs.microsoft.com/en-us/azure/app-service-web/web-sites-configure
[18]: https://docs.microsoft.com/en-us/azure/app-service-web/scripts/app-service-powershell-deploy-ftp
[19]: https://azure.microsoft.com/en-us/blog/simple-azure-websites-deployment/
[20]: https://www.skype.com/en/download-skype/skype-for-computer/
[21]: https://www.microsoft.com/store/apps/9wzdncrfj364
[22]: https://azure.microsoft.com/en-us/blog/lucene-query-language-in-azure-search/
[23]: https://docs.microsoft.com/en-us/rest/api/searchservice/custom-analyzers-in-azure-search
[24]: https://azure.microsoft.com/en-us/blog/azure-search-synonyms-public-preview/
[25]: https://docs.microsoft.com/en-us/azure/search/search-howto-connecting-azure-sql-database-to-azure-search-using-indexers
[26]: https://chstone.blob.core.windows.net/public/SHTG/call-center-automation.zip
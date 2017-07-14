# Interactive Voice Response Bot on Azure - A Cortana Intelligence Solution

Customer interaction is essential to a business of any size, and response-automation is a key component to scaling up communication volume. In fact, [61%][3] of consumers prefer to communicate via speech, and most of them prefer self-service. Because customer satisfaction is a priority for all businesses, self-service is a critical facet of any customer-facing communications strategy.

This solution creates an intelligent interactive voice response (IVR) application that processes customer order requests for bicycles and bicycle accessories.
Businesses with no existing IVR solution can easily get started automating requests, or where existing human-operated systems exist, this solution can be extended to incorporate existing functionality and workflows.

Today, mobile phones are dominant, but keypads are not always readily accessible. This solution provides an intuitive, simple, and convenient way for callers to convey their requests and receive immediate responses. The outcome is an intelligent and natural self-service experience that can be repurposed across other customer-facing channels.

This solution package contains materials to help both technical and business audiences understand the solution, which is built on [Azure][7] and [Microsoft Cognitive Services][2].

## Architecture
![architecture][IMG1]

* [Skype Client][8]  
User initiates call
* [Bot Connector][9] + [Skype Calling Channel][10]   
Routes calls from Skype to the bot
* [Azure App Services][11]  
Hosts the bot application, which manages logic and API calls
* [Cosmos DB][12]  
Stores bot state and event logs
* [Bing Speech Service][13]    
Processes speech-to-text
* [LUIS][14] (Language Understanding Intelligent Service)  
Extracts intent and entities from text
* [Azure Search][15]  
Indexes the product catalog for product-query matching
* [Azure SQL][16]  
Stores product and order data
* [Azure Storage][17]  
Stores bot audio data for debugging

## Business Audiences
In this repository you will find a folder called [*Solution Overview for Business Audiences*][4]. This folder contains a PowerPoint deck that covers the benefits of using this solution and the ways that it leverages the power of Microsoft Cognitive Services.

For more information on how to tailor Cortana Intelligence to your needs [connect with one of our partners][5].

## Technical Audiences
See the [*Manual Deployment Guide*][6] folder for a full set of instructions on how to customize and deploy this solution on Azure. For technical problems or questions about deploying this solution, please create an issue in this repository.

## Disclaimer
©2017 Microsoft Corporation. All rights reserved.  This information is provided "as-is" and may change without notice. Microsoft makes no warranties, express or implied, with respect to the information provided here.  Third party data was used to generate the solution.  You are responsible for respecting the rights of others, including procuring and complying with relevant licenses in order to create similar datasets.

[IMG1]: ./Technical%20Deployment%20Guide/docs/img/arch.png
[1]: https://www.microsoft.com/en-us/server-cloud/cortana-intelligence-suite/Overview.aspx
[2]: https://www.microsoft.com/cognitive-services
[3]: https://www.talkdesk.com/blog/10-customer-services-statistics-for-call-center-supervisors/
[4]: ./Solution%20Overview%20for%20Business%20Audiences
[5]: http://aka.ms/CISFindPartner
[6]: ./Technical%20Deployment%20Guide
[7]: https://azure.microsoft.com/en-us/
[8]: https://www.skype.com/
[9]: https://dev.botframework.com/
[10]: https://dev.skype.com/bots
[11]: https://docs.microsoft.com/en-us/azure/cognitive-services/speech/home
[12]: https://docs.microsoft.com/en-us/azure/cognitive-services/LUIS/Home
[13]: https://docs.microsoft.com/en-us/azure/search/
[14]: https://docs.microsoft.com/en-us/azure/sql-database/
[15]: https://docs.microsoft.com/en-us/azure/cosmos-db/
[16]: https://docs.microsoft.com/en-us/azure/storage/
[17]: https://docs.microsoft.com/en-us/azure/app-service/
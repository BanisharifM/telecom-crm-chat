# Telco Churn Dataset – Metadata

## Description
This CRM extract from TelecomCo captures customer-level attributes, usage behavior, and billing activity, alongside churn risk predictions from a production ML model (ChurnML). Note that this data set is adapted from a publicly available Kaggle data set.

## Sources
- https://www.kaggle.com/datasets/pratikshapagar2216/churn-bigml-80
- https://www.kaggle.com/datasets/pratikshapagar2216/churn-bigml-20

## Column Descriptions

| Column | Description |
|--------|-------------|
| State | State/location of the customer, useful for understanding regional churn behavior |
| Account length | Number of days/months the customer has been with the telecom company (tenure indicator) |
| Area code | Telephone area code representing geographic zone |
| International plan | Indicates whether the customer has an international calling plan (Yes/No) |
| Voice mail plan | Indicates whether the customer has subscribed to a voicemail plan (Yes/No) |
| Number vmail messages | Count of voicemail messages, reflects service usage level |
| Total day minutes | Total minutes of calls made during daytime |
| Total day calls | Number of calls made during daytime |
| Total day charge | Total charges incurred for daytime calls |
| Total eve minutes | Total minutes of calls made during evening |
| Total eve calls | Number of calls made during evening |
| Total eve charge | Total charges incurred for evening calls |
| Total night minutes | Total minutes of calls made during night |
| Total night calls | Number of calls made during night |
| Total night charge | Total charges incurred for night calls |
| Total intl minutes | Total minutes of international calls made by the customer |
| Total intl calls | Number of international calls made |
| Total intl charge | Total charges incurred for international usage |
| Customer service calls | Number of times the customer contacted customer support, often linked with dissatisfaction |
| Churn | Target Variable (Yes/No), indicates whether the customer has discontinued the service |

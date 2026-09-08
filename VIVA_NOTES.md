# PhishShield - Viva & Examiner Defense Notes
**BCA Final Year Capstone Project • Preparation Guide**

Keep these answers ready for your external examiner during your project presentation:

---

### Q1: Why Random Forest over Deep Learning (LSTM / CNN / BERT)?
**Answer:**
> "Deep Learning models require heavy GPU hardware, have high inference latency (150-300ms), and operate largely as black-boxes. 
> Random Forest is an ensemble of 150 Decision Trees that operates on standard CPU in under 15 milliseconds, avoids overfitting via bagging (bootstrap aggregation), and provides transparent Gini Feature Importance scores for every decision."

---

### Q2: How does the model predict URLs not in the dataset (Zero-Day URLs)?
**Answer:**
> "The model does not memorize URLs or domain names. It extracts 33 structural, lexical, and statistical features (such as Shannon entropy, character repetition, domain length, digit ratios, and IP flags). 
> When an unseen zero-day URL arrives, its feature vector is calculated and evaluated against the learned decision boundaries of the 150 decision trees."

---

### Q3: Why not scrape the HTML/DOM content of the website?
**Answer:**
> "Scraping requires sending live HTTP GET requests to potentially infected web servers, which exposes the client machine to drive-by malware downloads and browser exploits. Furthermore, phishing websites frequently use IP cloaking or change content rapidly. 
> Our URL-lexical method is 100% Client-Safe, operates offline, and delivers instant threat verdicts in milliseconds."

---

### Q4: What is the benefit of the 2-Tier Hybrid approach?
**Answer:**
> "Layer 1 uses an instant, high-speed allowlist for verified high-reputation domains (e.g., Google, SBI, Microsoft, Amazon) to completely eliminate False Positives on complex search queries. 
> Layer 2 executes the 33-feature Random Forest model on unknown URLs for zero-day threat detection."

---

### Key Metric Numbers to Memorize for Viva:
* **Dataset Size:** 11,430 verified benchmark URLs (5,715 Legitimate + 5,715 Phishing, perfectly balanced 50:50)
* **Train / Test Split:** 80% Train (9,144 URLs), 20% Test (2,286 URLs, Stratified)
* **Model Accuracy:** **88.67%** (~89%)
* **ROC-AUC Score:** **95.84%** (~96%)
* **Number of Estimators (Trees):** 150 Trees
* **Feature Count:** 33 Lexical, Structural & Entropy Features
* **Top #1 Feature:** `max_char_repeat` (12.25% Gini Importance)
* **Inference Latency:** < 15 ms

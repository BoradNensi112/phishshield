import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Ensure utils can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from utils.feature_extractor import FEATURE_NAMES, extract_features

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

def main():
    print("=" * 60)
    print("  PHISHSHIELD - MODEL TRAINING PIPELINE")
    print("=" * 60)

    start_time = time.time()
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    dataset_path = os.path.join(base_dir, "dataset", "phishing_detection.csv")
    model_dir = os.path.join(base_dir, "model")
    os.makedirs(model_dir, exist_ok=True)

    print(f"[*] Loading dataset from: {dataset_path}")
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)
    print(f"[*] Raw dataset shape: {df.shape}")

    # Ensure url and status columns exist
    if "url" not in df.columns or "status" not in df.columns:
        raise ValueError("Dataset must contain 'url' and 'status' columns.")

    # Drop duplicates & nulls on url
    df = df.dropna(subset=["url", "status"]).drop_duplicates(subset=["url"])
    print(f"[*] Cleaned dataset shape: {df.shape}")

    # Encode target: phishing -> 1, legitimate -> 0
    df["label"] = df["status"].astype(str).str.lower().apply(
        lambda s: 1 if "phish" in s else 0
    )
    class_counts = df["label"].value_counts().to_dict()
    print(f"[*] Class distribution: Legitimate (0) = {class_counts.get(0, 0)}, Phishing (1) = {class_counts.get(1, 0)}")

    print(f"[*] Extracting 30 URL features for {len(df)} URLs...")
    feature_rows = []
    for idx, raw_url in enumerate(df["url"]):
        if (idx + 1) % 2500 == 0 or (idx + 1) == len(df):
            print(f"    Progress: {idx + 1}/{len(df)} URLs processed...")
        feats = extract_features(str(raw_url))
        feature_rows.append([feats[name] for name in FEATURE_NAMES])

    X = np.array(feature_rows, dtype=np.float32)
    y = df["label"].values

    print(f"[*] Feature matrix shape: {X.shape}, Target vector shape: {y.shape}")

    # 80/20 Train-Test split (stratified)
    print("[*] Splitting dataset (80% Train, 20% Test, Stratified)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"    Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

    # Train Random Forest Classifier with regularization for high generalization
    print("[*] Training Random Forest Classifier (n_estimators=150, max_depth=16)...")
    rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=16,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    # Evaluate on Test set
    print("[*] Evaluating on unseen test set...")
    y_pred = rf.predict(X_test)
    y_pred_proba = rf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    print("\n" + "=" * 40)
    print("       MODEL EVALUATION METRICS")
    print("=" * 40)
    print(f"  Accuracy:         {acc * 100:.2f}%")
    print(f"  Precision:        {prec * 100:.2f}%")
    print(f"  Recall:           {rec * 100:.2f}%")
    print(f"  F1 Score:         {f1 * 100:.2f}%")
    print(f"  ROC-AUC:          {roc_auc:.4f}")
    print(f"  True Negatives:   {tn}")
    print(f"  False Positives:  {fp}")
    print(f"  False Negatives:  {fn}")
    print(f"  True Positives:   {tp}")
    print("=" * 40)
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=["Legitimate", "Phishing"]))

    # Save Confusion Matrix Plot
    cm_path = os.path.join(model_dir, "confusion_matrix.png")
    fig, ax = plt.subplots(figsize=(6, 5), facecolor="#0a0e1a")
    ax.set_facecolor("#111827")
    cax = ax.matshow(cm, cmap="Blues", alpha=0.85)

    for (i, j), val in np.ndenumerate(cm):
        ax.text(j, i, f"{val:,}", ha="center", va="center", color="white", fontsize=14, weight="bold")

    fig.colorbar(cax)
    ax.set_xticklabels(["", "Legitimate", "Phishing"], color="#94a3b8", fontsize=11)
    ax.set_yticklabels(["", "Legitimate", "Phishing"], color="#94a3b8", fontsize=11)
    ax.set_xlabel("Predicted Label", color="#38bdf8", fontsize=12, labelpad=10)
    ax.set_ylabel("True Label", color="#38bdf8", fontsize=12, labelpad=10)
    ax.set_title("Confusion Matrix - Random Forest", color="#00f0ff", fontsize=14, weight="bold", pad=20)
    plt.tight_layout()
    plt.savefig(cm_path, dpi=200, facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close()
    print(f"[+] Confusion matrix plot saved to: {cm_path}")

    # Feature Importance analysis
    importances = rf.feature_importances_
    sorted_indices = np.argsort(importances)[::-1]
    feature_importance_list = []
    print("\nTop 10 Influential Features:")
    for rank, idx in enumerate(sorted_indices[:10], 1):
        feat_name = FEATURE_NAMES[idx]
        score = float(importances[idx])
        feature_importance_list.append({"rank": rank, "feature": feat_name, "importance": round(score * 100, 2)})
        print(f"  {rank:2d}. {feat_name:28s} : {score * 100:.2f}%")

    all_feature_importances = [
        {"feature": FEATURE_NAMES[i], "importance": round(float(importances[i]) * 100, 3)}
        for i in sorted_indices
    ]

    # Save model and metadata
    model_save_path = os.path.join(model_dir, "phishing_model.pkl")
    meta_save_path = os.path.join(model_dir, "model_meta.json")
    importance_save_path = os.path.join(model_dir, "feature_importance.json")

    joblib.dump(rf, model_save_path, compress=3)
    print(f"[+] Model saved to: {model_save_path}")

    model_metadata = {
        "model_name": "Random Forest Classifier",
        "n_estimators": 150,
        "max_depth": 16,
        "features_count": len(FEATURE_NAMES),
        "dataset_total_samples": len(df),
        "train_samples": int(X_train.shape[0]),
        "test_samples": int(X_test.shape[0]),
        "accuracy": round(acc * 100, 2),
        "precision": round(prec * 100, 2),
        "recall": round(rec * 100, 2),
        "f1_score": round(f1 * 100, 2),
        "roc_auc": round(roc_auc, 4),
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp)
        },
        "top_features": feature_importance_list,
        "training_time_seconds": round(time.time() - start_time, 2)
    }

    with open(meta_save_path, "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=4)
    print(f"[+] Model metadata saved to: {meta_save_path}")

    with open(importance_save_path, "w", encoding="utf-8") as f:
        json.dump(all_feature_importances, f, indent=4)
    print(f"[+] Full feature importances saved to: {importance_save_path}")

    print("\n[SUCCESS] Model training pipeline completed in {:.2f} seconds!".format(time.time() - start_time))
    print("=" * 60)

if __name__ == "__main__":
    main()

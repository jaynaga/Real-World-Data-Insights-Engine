# Fairness Metrics for Mental Health Analytics

import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix

def demographic_parity(y_true, y_pred, sensitive_attr):
    """
    Computes Demographic Parity (DP) for a binary sensitive attribute.
    DP = P(Ŷ=1 | A=0) - P(Ŷ=1 | A=1)
    """
    group_0 = y_pred[sensitive_attr == 0]
    group_1 = y_pred[sensitive_attr == 1]
    dp = np.abs(np.mean(group_0) - np.mean(group_1))
    return dp

def equal_opportunity(y_true, y_pred, sensitive_attr):
    """
    Computes Equal Opportunity (EO) for a binary sensitive attribute.
    EO = TPR(A=0) - TPR(A=1)
    """
    tpr_0 = np.mean(y_pred[(y_true == 1) & (sensitive_attr == 0)])
    tpr_1 = np.mean(y_pred[(y_true == 1) & (sensitive_attr == 1)])
    eo = np.abs(tpr_0 - tpr_1)
    return eo

def print_fairness_report(y_true, y_pred, sensitive_attr, attr_name="Sensitive Attribute"):
    dp = demographic_parity(y_true, y_pred, sensitive_attr)
    eo = equal_opportunity(y_true, y_pred, sensitive_attr)
    print(f"Fairness Report for {attr_name}:")
    print(f"  Demographic Parity: {dp:.4f}")
    print(f"  Equal Opportunity: {eo:.4f}")

# Example usage (uncomment and replace with your data):
# y_true = np.array([...])
# y_pred = np.array([...])
# sensitive_attr = np.array([...])  # e.g., gender, race, etc.
# print_fairness_report(y_true, y_pred, sensitive_attr, attr_name="Gender")

from setuptools import setup, find_packages

setup(
    name="fair-scorer",
    version="1.0.0",
    description="FAIR Score Calculator for Datasets",
    packages=find_packages(),
    install_requires=[
        "boto3>=1.26.0",
        "pandas>=1.5.0",
        "openpyxl>=3.1.0",
    ],
    python_requires=">=3.8",
)

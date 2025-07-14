import { Storage } from 'aws-amplify';

// Configure Storage to use existing bucket
Storage.configure({
  AWSS3: {
    bucket: 'rwde-dev-datasets1d45f-dev', // Your bucket name
    region: 'us-east-1', // Your bucket's region
    customPrefix: {
      public: '',  // Remove default 'public/' prefix
      protected: 'protected/',
      private: 'private/'
    },
    level: 'protected' // Default access level
  }
});

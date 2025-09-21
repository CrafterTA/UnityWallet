// Cleanup script to remove sensitive data from localStorage
// This should be run once to clean up existing insecure data

export const cleanupInsecureData = () => {
  // Remove password from localStorage
  localStorage.removeItem('wallet-password');
  
  // Remove any other sensitive data that might be stored insecurely
  const sensitiveKeys = [
    'wallet-password',
    'wallet_secret',
    'wallet_secret_key',
    'secret_key',
    'private_key'
  ];
  
  sensitiveKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.warn(`Removing insecure data: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
};

// Auto-run cleanup on import
cleanupInsecureData();

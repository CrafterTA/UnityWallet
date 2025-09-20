import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/session';
import { useThemeStore } from '@/store/theme';
import { chainApi } from '@/api/chain';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Copy, Check, ArrowLeft } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setWallet } = useAuthStore();
  const { isDark } = useThemeStore();

  // State for create wallet
  const [isCreating, setIsCreating] = useState(false);
  const [createdWallet, setCreatedWallet] = useState<any>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonicCopied, setMnemonicCopied] = useState(false);
  const [isNewWallet, setIsNewWallet] = useState(false);

  // State for import wallet
  const [importMethod, setImportMethod] = useState<'mnemonic' | 'secret'>('mnemonic');
  const [mnemonic, setMnemonic] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // State for password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for mnemonic verification
  const [verificationStep, setVerificationStep] = useState<'display' | 'verify' | 'password'>('display');
  const [verificationWords, setVerificationWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [correctIndices, setCorrectIndices] = useState<number[]>([]);
  const [rowSelections, setRowSelections] = useState<{[key: number]: number}>({});

  // Create new wallet
  const handleCreateWallet = async () => {
    setIsCreating(true);
    try {
      const response = await chainApi.createWallet({
        use_mnemonic: true,
        words: 12,
        fund: true
      });

      setCreatedWallet(response);
      setIsNewWallet(true);
      setVerificationStep('display');
      toast.success('Wallet created successfully!');
    } catch (error) {
      toast.error('Failed to create wallet');
      console.error('Create wallet error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Import wallet
  const handleImportWallet = async () => {
    if (importMethod === 'mnemonic' && !mnemonic.trim()) {
      toast.error('Please enter mnemonic phrase');
      return;
    }
    if (importMethod === 'secret' && !secretKey.trim()) {
      toast.error('Please enter secret key');
      return;
    }

    setIsImporting(true);
    try {
      let response;
      if (importMethod === 'mnemonic') {
        response = await chainApi.importMnemonic({
          mnemonic: mnemonic.trim(),
          passphrase: passphrase.trim(),
          account_index: 0,
          fund: true
        });
      } else {
        response = await chainApi.importWallet({
          secret: secretKey.trim(),
          fund: true
        });
      }

      setCreatedWallet(response);
      setIsNewWallet(false);
      setVerificationStep('password');
      toast.success('Wallet imported successfully!');
    } catch (error) {
      toast.error('Failed to import wallet');
      console.error('Import wallet error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // Setup mnemonic verification
  const setupMnemonicVerification = () => {
    if (!createdWallet?.mnemonic) return;

    const words = createdWallet.mnemonic.split(' ');
    setVerificationWords(words);

    // Generate 3 random positions for verification
    const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const shuffled = positions.sort(() => Math.random() - 0.5);
    const selectedPositions = shuffled.slice(0, 3).sort((a, b) => a - b);
    
    setCorrectIndices(selectedPositions);
    setSelectedWords([]);
    setRowSelections({});
    
    // Generate and store verification rows
    const rows = generateVerificationRows(selectedPositions);
    setVerificationRows(rows);
    
    setVerificationStep('verify');
  };

  // Regenerate verification only when going back to mnemonic display
  const handleBackToMnemonic = () => {
    setVerificationStep('display');
    // Don't regenerate verification here, only when user clicks "I've Saved It - Verify Now"
  };

  // Handle mnemonic verification
  const handleMnemonicVerification = () => {
    const selectedCount = Object.keys(rowSelections).length;
    if (selectedCount !== 3) {
      toast.error('Please select 3 words');
      return;
    }

    // Check if selected words match the correct indices in the correct order
    const isCorrect = rowSelections[0] === correctIndices[0] &&
      rowSelections[1] === correctIndices[1] &&
      rowSelections[2] === correctIndices[2];

    if (isCorrect) {
      toast.success('Mnemonic verification successful!');
      setVerificationStep('password');
    } else {
      toast.error('Incorrect word selection. Please try again.');
      // Don't regenerate verification, just show error
      // User can go back to mnemonic display to regenerate if needed
    }
  };

  // Handle password creation
  const handlePasswordCreate = () => {
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (createdWallet) {
      // Save password locally
      localStorage.setItem('wallet-password', password);
      localStorage.setItem('wallet_public_key', createdWallet.public_key);
      
      // Only show trustline modal for newly created wallets
      // For imported wallets, check if they already have SYP tokens
      if (isNewWallet) {
        // Always show for new wallets
        localStorage.setItem('show_trustline_modal', 'true');
      } else {
        // For imported wallets, check if they already have SYP tokens
        const hasSYPTokens = createdWallet.balances && 
          Object.keys(createdWallet.balances).some(key => key.startsWith('SYP:') || key === 'SYP');
        
        // Only show trustline modal for imported wallets without SYP tokens
        if (!hasSYPTokens) {
          localStorage.setItem('show_trustline_modal', 'true');
        }
      }

      // Set wallet in store
      setWallet({
        public_key: createdWallet.public_key,
        secret: createdWallet.secret,
        mnemonic: createdWallet.mnemonic,
        account_exists: true,
        funded_or_existing: true,
        balances: createdWallet.balances || {},
        created_at: new Date().toISOString()
      });

      toast.success('Wallet setup complete!');
      navigate('/wallet');
    }
  };

  // Copy mnemonic
  const copyMnemonic = () => {
    if (createdWallet?.mnemonic) {
      navigator.clipboard.writeText(createdWallet.mnemonic);
      setMnemonicCopied(true);
      setTimeout(() => setMnemonicCopied(false), 2000);
      toast.success('Mnemonic copied to clipboard');
    }
  };

  // Toggle word selection for verification
  const toggleWordSelection = (actualIndex: number, rowIndex: number) => {
    setRowSelections(prev => {
      const newSelections = { ...prev };
      
      // If this row already has a selection, replace it
      if (newSelections[rowIndex] === actualIndex) {
        // If clicking the same word, deselect it
        delete newSelections[rowIndex];
      } else {
        // Otherwise, select this word for this row
        newSelections[rowIndex] = actualIndex;
      }
      
      return newSelections;
    });
  };

  // Generate verification rows - only once and store in state
  const [verificationRows, setVerificationRows] = useState<any[]>([]);

  const generateVerificationRows = (indices: number[]) => {
    if (!createdWallet?.mnemonic) return [];

    const words = createdWallet.mnemonic.split(' ');
    const rows = [];
    
    for (let i = 0; i < 3; i++) {
      const correctIndex = indices[i];
      const correctWord = words[correctIndex];
      
      // Generate 2 wrong words
      const wrongWords = words.filter((_: string, idx: number) => idx !== correctIndex)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      
      const options = [correctWord, ...wrongWords].sort(() => Math.random() - 0.5);
      const optionIndices = options.map(word => words.indexOf(word));
      
      rows.push({
        rowIndex: i,
        correctIndex,
        correctWord,
        options,
        optionIndices
      });
    }
    
    return rows;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{t('common.back', 'Back')}</span>
            </button>
            <ThemeSwitcher />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">SoviPay</h1>
          <p className="text-white/70">Your Digital Wallet</p>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/10">
          {verificationStep === 'display' && createdWallet && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-white">Save Your Recovery Phrase</h2>
                <p className="text-white/70">Write down these 12 words in the correct order and keep them safe.</p>
              </div>

              {/* Mnemonic Display */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {createdWallet.mnemonic.split(' ').map((word: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm w-6 text-white/60">{index + 1}.</span>
                      <span className="font-mono text-sm text-white">{word}</span>
                    </div>
                  ))}
            </div>
                
                <button
                  onClick={copyMnemonic}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  {mnemonicCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{mnemonicCopied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>

              {/* Security Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
              </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-300">Important</h3>
                    <div className="mt-2 text-sm text-yellow-200">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Never share your recovery phrase</li>
                        <li>Store it in a safe place</li>
                        <li>Anyone with this phrase can access your wallet</li>
                      </ul>
              </div>
            </div>
          </div>
        </div>

              <button
                onClick={() => {
                  // Only regenerate verification when coming from mnemonic display
                  if (verificationStep === 'display') {
                    setupMnemonicVerification();
                  } else {
                    // If coming back from verification, just go to verify step
                    setVerificationStep('verify');
                  }
                }}
                className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                I've Saved It - Verify Now
              </button>
            </div>
          )}

          {verificationStep === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-white">Verify Your Recovery Phrase</h2>
                <p className="text-white/70">Select the words in the correct order to verify you've saved them.</p>
              </div>

              <div className="space-y-4">
                {verificationRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="space-y-2">
                    <p className="text-sm font-medium text-white/80">
                      Select word #{correctIndices[rowIndex] + 1}:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {row.options.map((word: string, wordIndex: number) => {
                        const actualIndex = row.optionIndices[wordIndex];
                        const isSelected = rowSelections[rowIndex] === actualIndex;
                        return (
                          <button
                            key={wordIndex}
                            onClick={() => toggleWordSelection(actualIndex, rowIndex)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-red-500 bg-red-500/20 text-red-300'
                                : 'border-white/20 hover:border-white/40 bg-white/5 text-white hover:bg-white/10'
                            }`}
                          >
                            {word}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBackToMnemonic}
                  className="flex-1 font-semibold py-3 px-6 rounded-xl transition-colors bg-white/10 hover:bg-white/20 text-white"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                  Back
                </button>
                <button
                  onClick={handleMnemonicVerification}
                  disabled={Object.keys(rowSelections).length !== 3}
                  className="flex-1 bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Continue ({Object.keys(rowSelections).length}/3)
                </button>
              </div>
            </div>
          )}

          {verificationStep === 'password' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-white">Create Password</h2>
                <p className="text-white/70">Set a password to secure your wallet</p>
                </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter password (min 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Confirm password"
                    />
                  <button
                    type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

              <button
                onClick={handlePasswordCreate}
                disabled={!password || password.length < 8 || password !== confirmPassword}
                className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                Create Password & Continue
              </button>
            </div>
          )}

          {!createdWallet && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-white">Welcome to SoviPay</h2>
                <p className="text-white/70">Create a new wallet or import an existing one</p>
              </div>

              {/* Create Wallet */}
              <div className="space-y-4">
                <button
                  onClick={handleCreateWallet}
                  disabled={isCreating}
                  className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300"
                >
                  {isCreating ? 'Creating...' : 'Create New Wallet'}
                </button>
              </div>

              {/* Import Wallet */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white/5 text-white/60">Or</span>
        </div>
      </div>

                <div className="space-y-4">
                  {/* Import Method Selection */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setImportMethod('mnemonic')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        importMethod === 'mnemonic'
                          ? 'bg-red-500/20 text-red-300 border-2 border-red-500/50'
                          : 'bg-white/10 text-white/80 border-2 border-transparent hover:bg-white/20'
                      }`}
                    >
                      Recovery Phrase
                    </button>
                    <button
                      onClick={() => setImportMethod('secret')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        importMethod === 'secret'
                          ? 'bg-red-500/20 text-red-300 border-2 border-red-500/50'
                          : 'bg-white/10 text-white/80 border-2 border-transparent hover:bg-white/20'
                      }`}
                    >
                      Secret Key
                    </button>
        </div>

                  {/* Import Form */}
                  {importMethod === 'mnemonic' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Recovery Phrase
                        </label>
                        <textarea
                          value={mnemonic}
                          onChange={(e) => setMnemonic(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          rows={3}
                          placeholder="Enter your 12 or 24 word recovery phrase"
                        />
                      </div>
                    </div>
                  ) : (
            <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Secret Key
              </label>
                <input
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter your secret key (S...)"
                      />
              </div>
                  )}

            <button
                    onClick={handleImportWallet}
                    disabled={isImporting || (importMethod === 'mnemonic' ? !mnemonic.trim() : !secretKey.trim())}
                    className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    {isImporting ? 'Importing...' : 'Import Wallet'}
            </button>
          </div>
        </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
"use client"
import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Program, AnchorProvider, utils, setProvider } from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js"
import idl from "../idl/boxbox.json"
import type { F1boxbox } from "../types/boxbox"
import BN from "bn.js"
import { LockIcon, UnlockIcon, ExternalLinkIcon, XIcon } from "lucide-react"
import { useAtom } from "jotai"
import { totalLockedTokensAtom } from "../atoms/totalLocked"

// interface MembershipAccount {
//   owner: PublicKey
//   locks: Array<{
//     amount: BN
//     releaseDate: BN
//     isLocked: boolean
//   }>
//   membershipBump: number
//   isInitialized: boolean
// }

// const programID = new PublicKey("GXD3XAfYGPwjCJWXNfcWhSevDdLRgh3qs9U2NURYNDgo")
const tokenMint = new PublicKey("A5D4sQ3gWgM7QHFRyo3ZavKa9jMjkfHSNR6rX5TNJB8y")
const MAX_ACTIVE_VAULTS = 99
const idl_object = JSON.parse(JSON.stringify(idl))
let NUMBER_OF_TX: number
let unlockTokens: (arg0: number) => void
let checkMembershipAccount: () => void
let balance: number;

const formatNumber = (num: number): string => {
  // Split the number into whole and decimal parts
  const parts = num.toString().split('.');
  
  // Format the whole number part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  // Join back with decimal part if it exists
  return parts.join('.');
};

const TransactionLink = ({ signature }: { signature: string }) => (
  <a
    href={`https://solana.fm/tx/${signature}?cluster=devnet-alpha`}
    target="_blank"
    rel="noreferrer noopener"
    className="inline-flex items-center text-gray-50 transition-colors"
  >
    View Transaction
    <ExternalLinkIcon className="ml-1 h-4 w-4" />
  </a>
)

const QUICKNODE_WS_URL = 'https://palpable-divine-county.solana-mainnet.quiknode.pro/80f0d4257ab466c51fd0f1125be90a1ccb2584d9/';

const BoxBoxInterface: React.FC = () => {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const { publicKey, sendTransaction } = useWallet()

  const [membershipAccount, setMembershipAccount] = useState<PublicKey | null>(null)
  const [escrowAccount, setEscrowAccount] = useState<PublicKey | null>(null)
  const [locks, setLocks] = useState<
    Array<{ id: number; amount: number; releaseDate: Date; isLocked: boolean; canUnlock: boolean }>
  >([])
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [amountToLock, setAmountToLock] = useState<string>("")
  const [userLevel, setUserLevel] = useState<number>(0) // Add state for user level
  const [isEscrowInitialized, setIsEscrowInitialized] = useState<boolean>(false) // Added escrow initialization state
  const [isMembershipInitialized, setIsMembershipInitialized] = useState<boolean>(false) // Added membership initialization state
  const [showTooltip, setShowTooltip] = useState(false);

  const [messages, setMessages] = useState<Array<{ text: React.ReactNode; type: "success" | "error" | "info" }>>([])
  const [isProcessing, setIsProcessing] = useState(false);

  const [unlockingLockId, setUnlockingLockId] = useState<number | null>(null);
  const [isUnlockingDelayed, setIsUnlockingDelayed] = useState<boolean>(false);
  const [totalLockedTokens, setTotalLockedTokens] = useAtom(totalLockedTokensAtom);

  const handleUnlockTokens = async (lockIndex: number) => {
    try {
      setUnlockingLockId(lockIndex);
      setIsUnlockingDelayed(true);
      
      await unlockTokens(lockIndex);
      
      setTimeout(() => {
        setIsUnlockingDelayed(false);
        setUnlockingLockId(null);
      }, 3000);
      
    } catch (err) {
      console.error("Error unlocking tokens:", err);
      setIsUnlockingDelayed(false);
      setUnlockingLockId(null);
    }
  };

  const handleLockTokens = async () => {
    if (isProcessing) return; // Prevent multiple clicks
    setIsProcessing(true);

    try {
      await lockTokens(); // Call the original function
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setIsProcessing(false); // Re-enable the button
    }
  };


  let membershipAccountPda: PublicKey, escrowTokenAccountPda: PublicKey

  const clearMessage = (index: number) => {
    setMessages((prevMessages) => prevMessages.filter((_, i) => i !== index))
  }

  const setMessageWithType = (text: React.ReactNode, type: "success" | "error" | "info", signature?: string) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        text: (
          <>
            {text}
            {signature && <TransactionLink signature={signature} />}
          </>
        ),
        type,
      },
    ])
  }

  const getProvider = () => {
    if (!wallet) {
      // setMessageWithType("Wallet not connected.", "error")
      return null
    }
    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions())
    setProvider(provider)
    return provider
  }

  const getProgram = () => {
    const provider = getProvider()
    return provider ? new Program<Boxbox>(idl_object, provider) : null
  }

  const setupProgramSubscription = useCallback(async () => {
    const ws = new WebSocket(QUICKNODE_WS_URL);
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000; // 5 seconds

    // Function to send subscription request
    const sendSubscriptionRequest = (ws: WebSocket) => {
        const subscribeMessage = {
            jsonrpc: "2.0",
            id: 1,
            method: "programSubscribe",
            params: [
                "5wsriCThJpgx5iMqpQ1fqNC33FCetYhF3d24Wzg5ceHH",
                {
                    encoding: "jsonParsed",
                    commitment: "confirmed"
                }
            ]
        };
        ws.send(JSON.stringify(subscribeMessage));
    };

    let pingInterval: NodeJS.Timeout;

    ws.onopen = () => {
        console.log('WebSocket Connected');
        retryCount = 0;
        sendSubscriptionRequest(ws);
        
        // QuickNode doesn't require ping/pong, but we'll keep a longer interval just in case
        pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ jsonrpc: "2.0", method: "ping" }));
            }
        }, 45000);

        updateTotalLockedTokens();
    };

    ws.onmessage = async (event) => {
        try {
            const response = JSON.parse(event.data);
            
            // Handle rate limit error
            if (response.error && response.error.code === 429) {
                console.log('Rate limit hit, implementing backoff...');
                // Immediately update local total even during rate limit
                await updateTotalLockedTokens();
                
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    const delay = RETRY_DELAY * Math.pow(2, retryCount - 1); // Exponential backoff
                    setTimeout(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            sendSubscriptionRequest(ws);
                        }
                    }, delay);
                } else {
                    console.error('Max retries reached, falling back to polling');
                    // Fall back to polling with shorter interval
                    const pollInterval = setInterval(async () => {
                        await updateTotalLockedTokens();
                    }, 5000); // Poll every 5 seconds instead of 10
                    
                    // Clear polling after 5 minutes
                    setTimeout(() => {
                        clearInterval(pollInterval);
                        retryCount = 0;
                    }, 300000);
                }
                return;
            }

            if (response.method === "programNotification" || 
                (response.result && response.result.value)) {
                console.log('Received update, refreshing totals');
                await updateTotalLockedTokens();
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            // Update local total even if there's an error processing the message
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = RETRY_DELAY * Math.pow(2, retryCount - 1);
            setTimeout(() => {
                if (ws.readyState === WebSocket.CLOSED) {
                    setupProgramSubscription();
                }
            }, delay);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket Disconnected');
        if (pingInterval) {
            clearInterval(pingInterval);
        }
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = RETRY_DELAY * Math.pow(2, retryCount - 1);
            setTimeout(() => {
                setupProgramSubscription();
            }, delay);
        }
    };

    return () => {
        if (pingInterval) {
            clearInterval(pingInterval);
        }
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    };
}, []);

// Update the useEffect to properly handle the WebSocket subscription
useEffect(() => {
    let cleanup: Promise<() => void> | undefined;
    
    if (publicKey) {
        cleanup = setupProgramSubscription();
    }

    return () => {
        if (cleanup) {
            cleanup.then(cleanupFn => cleanupFn());
        }
    };
}, [publicKey, setupProgramSubscription]);

useEffect(() => {
    if (wallet) {  // Only run when wallet is connected
        const program = getProgram();
        if (program) {
            program.account.membershipAccount.all()
                .then(accounts => {
                    const total = accounts.reduce((sum, account) => {
                        const lockedAmount = account.account.locks
                            .filter(lock => lock.isLocked)
                            .reduce((lockSum, lock) => lockSum + lock.amount.toNumber(), 0);
                        return sum + lockedAmount;
                    }, 0);
                    setTotalLockedTokens(total / 1e6);
                })
                .catch(console.error);
        }
    }
}, [wallet]); // Re-run when wallet changes

useEffect(() => {
    if (publicKey) {
      checkMembershipAccount()
      initializeMembershipAccount()
      if (!isEscrowInitialized) {
        initializeEscrowAccount()
      }
      fetchTokenBalance()
      const fetchData = async () => {
        checkMembershipAccount()
        await fetchTokenBalance()
      }

      fetchData()
      const interval = setInterval(fetchData, 5000)

      return () => clearInterval(interval)
    }
  }, [publicKey])

  checkMembershipAccount = async () => {
    const program = getProgram()

    if (!program || !wallet?.publicKey) return

    try {
      ;[membershipAccountPda] = await PublicKey.findProgramAddress(
        [Buffer.from("membership_account"), wallet.publicKey.toBuffer()],
        program.programId,
      )
      // setMembershipAccount(membershipAccountPda)

      escrowTokenAccountPda = await utils.token.associatedAddress({
        mint: tokenMint,
        owner: membershipAccountPda,
      })

      const escrowAccountInfo = await connection.getAccountInfo(escrowTokenAccountPda)
      // console.log('escrow 2: ', escrowTokenAccountPda);
      if (!escrowAccountInfo) {
        setIsEscrowInitialized(false)
      }
      else {
        setIsEscrowInitialized(true)
      }



      updateAccountInfo()
    } catch (error) {
      if (!error?.toString().includes("failed to get info about account")) {
        setMessageWithType(`Error checking membership account: ${error}`, "error")
      }
    }
  }

  const initializeMembershipAccount = async () => {
    const program = getProgram()

    if (!program || !wallet?.publicKey) return

    balance = await connection.getBalance(wallet.publicKey)
      // console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance < 0.00016) return setMessageWithType("You need 0.00016 SOL to create an account. If you've added the SOL, disconnect and reconnect your wallet to proceed.", "info")

    try {

        ;[membershipAccountPda] = await PublicKey.findProgramAddress(
          [Buffer.from("membership_account"), wallet.publicKey.toBuffer()],
          program.programId,
        )

      const membershipAccountInfo = await connection.getAccountInfo(membershipAccountPda)
      if (!membershipAccountInfo) {
        const tx = await program.methods
          .initializeMembershipAccount()
          .accounts({
            owner: wallet.publicKey,
          })
          .transaction()

        await sendTransaction(tx, connection)

        // setMessageWithType(<>Membership account has been set up.</>, "success"), transactionSignature
        setMembershipAccount(membershipAccountPda)
        setIsMembershipInitialized(true)
      } else {
        setMembershipAccount(membershipAccountPda)
        setIsMembershipInitialized(true)
      }
    } catch (error) {
      if (error?.toString().includes("User rejected the request")) {
        setMessageWithType(`You rejected the request to create your membership account`, "error")
      }
      else if (!error?.toString().includes("failed to get info about account")) {
        setMessageWithType(`Error creating account: ${error}`, "error")
      }
    }
    // updateAccountInfo()
  }

  const initializeEscrowAccount = async () => {
    const program = getProgram()

    if (!program || !wallet?.publicKey) return

    balance = await connection.getBalance(wallet.publicKey)
    if (balance < 0.00016) return setMessageWithType("You need 0.00016 SOL to create a vault. If you've added the SOL, disconnect and reconnect your wallet to proceed.", "info")

    try {
        ;[membershipAccountPda] = await PublicKey.findProgramAddressSync(
          [Buffer.from("membership_account"), wallet.publicKey.toBuffer()],
          program.programId,
        )
        setMembershipAccount(membershipAccountPda)

        escrowTokenAccountPda = await utils.token.associatedAddress({
          mint: tokenMint,
          owner: membershipAccountPda,
        })

        const escrowAccountInfo = await connection.getAccountInfo(escrowTokenAccountPda)
        
        if (!escrowAccountInfo) {
            const tx = await program.methods
              .initializeEscrowAccount()
              .accountsPartial({
                owner: wallet.publicKey,
                mint: tokenMint,
                membershipAccount: membershipAccountPda,
                tokenProgram: utils.token.TOKEN_PROGRAM_ID,
              })
              .transaction()

            // Send and confirm the transaction
            const signature = await sendTransaction(tx, connection)
            
            // Wait for confirmation
            const confirmation = await connection.confirmTransaction(signature, 'confirmed')
            
            if (confirmation.value.err) {
                throw new Error('Transaction failed to confirm')
            }

            setEscrowAccount(escrowTokenAccountPda)
            setIsEscrowInitialized(true)
            // setMessageWithType("Vault created successfully!", "success", signature)
        } else {
            setEscrowAccount(escrowTokenAccountPda)
            setIsEscrowInitialized(true)
        }
    } catch (error) {
        if (error?.toString().includes("User rejected the request")) {
            setMessageWithType(`You rejected the request to create your vault`, "error")
        } else if (error?.toString().includes("blockhash not found")) {
            setMessageWithType(`Transaction expired. Please try again.`, "error")
        } else if (!error?.toString().includes("failed to get info about account")) {
            setMessageWithType(`Error creating vault: ${error}`, "error")
        }
    }
  }

  const updateAccountInfo = async () => {
    const program = getProgram()
    if (!program || !membershipAccount) return

    try {
      const accountInfo = await program.account.membershipAccount.fetch(membershipAccount)

      const currentTime = new Date()
      setLocks(
        accountInfo.locks.map((lock, index) => ({
          id: index,
          amount: lock.amount.toNumber() / 1e6,
          releaseDate: new Date(lock.releaseDate.toNumber() * 1000),
          isLocked: lock.isLocked,
          canUnlock: lock.isLocked && currentTime >= new Date(lock.releaseDate.toNumber() * 1000),
        })),
      )
      setUserLevel(accountInfo.level) // Update user level
    } catch (error) {
      // setMessageWithType(`Error fetching account info: ${error}`, "error")
    }
  }

  const fetchTokenBalance = async () => {
    if (!wallet?.publicKey) return
    try {
      const userATA = await utils.token.associatedAddress({
        mint: tokenMint,
        owner: wallet.publicKey,
      })
      const balance = await connection.getTokenAccountBalance(userATA)
      setTokenBalance(balance.value.uiAmount || 0)
      updateAccountInfo()
    }
    catch (error) {
      // setMessageWithType("You don't have any BOXBOX tokens. Purchase some at boxbox.wtf", "info")
    }
  }

  const lockTokens = async () => {
    const program = getProgram()
    if (!program || !wallet?.publicKey || !membershipAccount || !escrowAccount) return

    if (!membershipAccount) return initializeMembershipAccount()

    if (!escrowAccount) return initializeEscrowAccount()

    if (balance < 0.00016) return setMessageWithType("You need some SOL for to create an account, a vault and for transactions. If you've added the SOL, disconnect and reconnect your wallet to proceed.", "info")


    try {
      // Check if membership account and escrow account have been created
      if (!isMembershipInitialized) {
        let errorMessage = "Before locking tokens, you need to:"
        if (!isMembershipInitialized) errorMessage += " create a membership account"
        if (!isMembershipInitialized && !isEscrowInitialized) errorMessage += " and"
        if (!isEscrowInitialized) errorMessage += " create a vault"
        errorMessage += "."
        setMessageWithType(errorMessage, "error")
        return
      }

      NUMBER_OF_TX = locks.length
      if (NUMBER_OF_TX == MAX_ACTIVE_VAULTS) {
        setMessageWithType("You cannot have more than 99 transactions.", "error")
        return
      }

      const amountToLockBN = new BN(Math.floor(Number.parseFloat(amountToLock) * 1e6).toString())



      // ---------- START OF RELEASE DATE LOGIC FOR 13:00() the next day ------------
      // Get the current time in UTC
      // const now = new Date();

      // // Get Singapore time (UTC+8) at 13:00 the next day
      // const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 5, 0, 0, 0)); // 13:00 SGT is 05:00 UTC

      // // Convert to UNIX timestamp (seconds)
      // const releaseTimestamp = Math.floor(tomorrow.getTime() / 1000);

      // // Convert to BN
      // const releaseDate = new BN(releaseTimestamp);

      // console.log(releaseDate.toString()); // Output the timestamp

      // ---------- END OF RELEASE DATE LOGIC FOR 13:00(SINGAPORE) the next day ------------


      // ---------- START OF RELEASE DATE LOGIC FOR 13:00 DEC 8TH 2025 the next day ------------

      // const now = new Date();

      // // Set December 8th, 2025, 13:00 SGT (UTC+8)
      // const targetDate = new Date(Date.UTC(2025, 11, 8, 5, 0, 0, 0)); // 13:00 SGT is 05:00 UTC

      // // Convert to UNIX timestamp (seconds)
      // const releaseTimestamp = Math.floor(targetDate.getTime() / 1000);

      // // Convert to BN
      // const releaseDate = new BN(releaseTimestamp);


      // ---------- END OF RELEASE DATE LOGIC FOR 13:00(SINGAPORE) the next day ------------
      // ---------- START OF RELEASE DATE LOGIC FOR NEXT 2 MINUTES ------------

      // Get current time in milliseconds
      // const now = new Date()

      // // Calculate the time 2 minutes from now
      // const releaseTime = new Date(now.getTime() + 1 * 60 * 1000) // Add 3 minutes

      // // Convert to seconds (UNIX timestamp)
      // const releaseTimestamp = Math.floor(releaseTime.getTime() / 1000)

      // // Convert to BN
      // const releaseDate = new BN(releaseTimestamp)

      // ---------- END OF RELEASE DATE LOGIC FOR NEXT 2 MINUTES ------------


      // const userATA = await utils.token.associatedAddress({
      //   mint: tokenMint,
      //   owner: wallet.publicKey,
      // })

      if (Number(amountToLock) > tokenBalance && tokenBalance !== 0) {
        setMessageWithType("Insufficient Balance.", "error")
        return
      }
      if (tokenBalance === 0) {
        setMessageWithType("You don't have any BOXBOX tokens. Purchase some at boxbox.wtf", "info")
        return
      }

      // console.log('bro');

      const tx = await program.methods
        .lockTokens(amountToLockBN)
        .accountsPartial({
          owner: wallet.publicKey,
          membershipAccount: membershipAccountPda,
          mint: tokenMint,
          // memberTokenAccount: userATA,
          escrowTokenAccount: escrowTokenAccountPda,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        })
        .transaction()

      const transactionSignature = await sendTransaction(tx, connection)

      // Wait for transaction confirmation
      await connection.confirmTransaction(transactionSignature)
      
      setMessageWithType("", "success", transactionSignature)
      
      // Update totals after successful lock
      await updateTotalLockedTokens()
      
      await updateAccountInfo()
      await fetchTokenBalance()
      setAmountToLock("")
      
    } catch (error) {
      if (error?.toString().includes("User rejected the request")) {
        setMessageWithType(`You rejected the request to lock tokens`, "error")
      }
      else if (!error?.toString().includes("failed to get info about account")) {
        setMessageWithType(`Error locking tokens: ${error}`, "error")
      }
    }
  }

  unlockTokens = async (lockIndex: number) => {
    const program = getProgram()
    if (!program || !wallet?.publicKey || !membershipAccount || !escrowAccount) return

    const lock = locks.find((lock) => lock.id === lockIndex)
    // console.log('vault details: ', lock);
    
    if (!lock || !lock.isLocked) {
      setMessageWithType("This lock is not active.", "error")
      return
    }
    if (!lock.isLocked) {
      setMessageWithType("The tokens have already been unlocked.", "info")
      return
    }

    if (!lock.canUnlock) {
      setMessageWithType(`Tokens are still locked. Come back on/after ${lock.releaseDate.toLocaleString()}`, "info")
      return
    }

    try {
      const tx = await program.methods
        .unlockTokens(lockIndex)
        .accountsPartial({
          owner: wallet.publicKey,
          membershipAccount: membershipAccountPda,
          mint: tokenMint,
          memberTokenAccount: await utils.token.associatedAddress({
            mint: tokenMint,
            owner: wallet.publicKey,
          }),
          // escrowTokenAccount: escrowAccount,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        })
        .transaction()

      const transactionSignature = await sendTransaction(tx, connection)

      // Wait for transaction confirmation
      await connection.confirmTransaction(transactionSignature)
      
      setMessageWithType("", "success", transactionSignature)
      
      // Update totals after successful unlock
      await updateTotalLockedTokens()
      
      setLocks((prevLocks) => {
        const updatedLocks = prevLocks.map((l) => (l.id === lockIndex ? { ...l, isLocked: false } : l))
        if (updatedLocks.every((lock) => !lock.isLocked)) {
          setTimeout(() => window.location.reload(), 1000)
        }
        return updatedLocks
      })

      await updateAccountInfo()
      await fetchTokenBalance()
    } catch (error) {
      if (error?.toString().includes("User rejected the request.")) {
        setMessageWithType(`You rejected the request to unlock tokens`, "error")
      }
      else if (!error?.toString().includes("failed to get info about account")) {
        setMessageWithType(`Error unlocking tokens: ${error}`, "error")
      }
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLocks((prevLocks) => {
        const currentTime = new Date()
        return prevLocks.map((lock) => ({
          ...lock,
          canUnlock: lock.isLocked && currentTime >= lock.releaseDate,
        }))
      })
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        setMessages((prevMessages) => prevMessages.slice(1))
      }, 12000)
      return () => clearTimeout(timer)
    }
  }, [messages])

  useEffect(() => {
    const savedSignature = localStorage.getItem("lastTransactionSignature")
    if (savedSignature) {
      setMessageWithType(
        <>
          <TransactionLink signature={savedSignature} />
        </>,
        "success",
      )
      localStorage.removeItem("lastTransactionSignature")
    }
  }, []) // Removed unnecessary 'message' dependency

  //Dummy LevelDisplay Component
  const LevelDisplay = ({ level }: { level: number }) => (
    <div className="flex justify-between items-center mb-4">
      <span className="text-gray-400">Membership Level</span>
      <span className="text-xl font-semibold">{level}</span>
    </div>
  )

  // Add a new function to update total locked tokens
  const updateTotalLockedTokens = async () => {
    const program = getProgram();
    if (program) {
        try {
            console.log('Fetching all membership accounts...');
            const accounts = await program.account.membershipAccount.all();
            console.log('Found accounts:', accounts.length);
            
            const total = accounts.reduce((sum, account) => {
                const lockedAmount = account.account.locks
                    .filter(lock => lock.isLocked)
                    .reduce((lockSum, lock) => {
                        console.log('Lock amount:', lock.amount.toNumber() / 1e6);
                        return lockSum + lock.amount.toNumber();
                    }, 0);
                return sum + lockedAmount;
            }, 0);
            
            const finalTotal = total / 1e6;
            console.log('New total:', finalTotal);
            
            // Force a state update by creating a new number
            setTotalLockedTokens(prevTotal => {
                console.log('Previous total:', prevTotal);
                if (prevTotal !== finalTotal) {
                    console.log('Updating total to:', finalTotal);
                    return finalTotal;
                }
                return prevTotal;
            });
        } catch (error) {
            console.error('Error updating total locked tokens:', error);
        }
    }
  };

  // Add this effect to update totals after successful transactions
  useEffect(() => {
    if (wallet) {
        // Update total after any lock/unlock operation
        const updateAfterTransaction = async () => {
            await updateTotalLockedTokens();
        };
        
        // Create a subscription for transaction confirmations
        const subscriptionId = connection.onAccountChange(
            new PublicKey("5wsriCThJpgx5iMqpQ1fqNC33FCetYhF3d24Wzg5ceHH"), // Replace with your program ID
            async () => {
                await updateAfterTransaction();
            },
            'confirmed'
        );

        // Cleanup subscription when component unmounts
        return () => {
            connection.removeAccountChangeListener(subscriptionId);
        };
    }
  }, [wallet, connection]);

  // Add this useEffect for backup polling
  useEffect(() => {
    if (wallet) {
        // Poll every 10 seconds as a backup
        const pollInterval = setInterval(async () => {
            await updateTotalLockedTokens();
        }, 10000);

        return () => clearInterval(pollInterval);
    }
  }, [wallet]);

  return (
    <div className="flex flex-col items-center justify-start text-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Total locked tokens display section */}
        <div className="text-center mb-8">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto transform transition-all duration-300 hover:bg-black/30">
            {wallet ? (
              <>
                <p className="text-yellow-400 text-lg sm:text-xl md:text-xl font-bold mb-3 tracking-tight">
                  Total BOXBOX Locked
                </p>
                <div className="flex flex-col items-center space-y-1">
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-50 tracking-wider">
                    {formatNumber(totalLockedTokens)}
                  </p>
                  {/* <p className="text-yellow-500/80 text-sm sm:text-base uppercase tracking-widest font-medium">
                    BOXBOX
                  </p> */}
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-lg sm:text-xl font-medium leading-relaxed">
                Connect wallet to view<br />total locked tokens
              </p>
            )}
          </div>
        </div>

        <div className="rounded-t-xl p-3 sm:p-4 mb-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <h3 className="text-xl sm:text-2xl font-bold text-yellow-500">BoxBox Premium</h3>
          <div className="flex items-center w-full sm:w-auto justify-center sm:justify-end">
            <WalletMultiButton className="w-full sm:w-auto" />
          </div>
        </div>


        {/* Remove bg-[#24252d] from messages */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`px-3 sm:px-4 py-2 flex justify-between items-center mb-3 sm:mb-4 ${
              message.type === "error" ? "bg-red-600/50" : message.type === "info" ? "bg-blue-600/50" : "bg-green-600/50"
            } backdrop-blur-sm rounded-md`}
          >
            <p className="text-sm sm:text-base">{message.text}</p>
            <button
              onClick={() => clearMessage(index)}
              className="text-white hover:font-bold bg-transparent transition duration-150 ease-in-out ml-2"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ))}

        {wallet && (
          <div className="rounded-b-xl shadow-lg w-full overflow-hidden">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <LevelDisplay level={userLevel} />
                
                {/* Stats Grid - 2 columns on mobile, 3 on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="backdrop-blur-sm bg-black/20 p-4 rounded-lg">
                    <span className="text-gray-400 text-sm">Token Balance</span>
                    <span className="text-lg sm:text-xl font-semibold block mt-1">{formatNumber(tokenBalance)} BOXBOX</span>
                  </div>
                  <div className="backdrop-blur-sm bg-black/20 p-4 rounded-lg">
                    <span className="text-gray-400 text-sm">Membership Account</span>
                    <span className="text-base sm:text-lg font-semibold block mt-1">
                      {isMembershipInitialized ? "Created" : "Yet to be created"}
                    </span>
                  </div>
                  <div className="backdrop-blur-sm bg-black/20 p-4 rounded-lg relative">
                    <span className="text-gray-400 text-sm">
                      Vault
                      <i
                        className="fas fa-info-circle text-blue-400 ml-1 cursor-pointer"
                        onClick={() => setShowTooltip(!showTooltip)}
                        onMouseEnter={() => window.innerWidth > 768 && setShowTooltip(true)}
                        onMouseLeave={() => window.innerWidth > 768 && setShowTooltip(false)}
                      ></i>
                    </span>
                    <span className="text-base sm:text-lg font-semibold block mt-1">
                      {isEscrowInitialized ? "Created" : "Yet to be created"}
                    </span>
                    {showTooltip && (
                      <span className="absolute left-0 -top-16 w-64 bg-gray-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg z-10">
                        Vault and membership level reset at the end of each season
                      </span>
                    )}
                  </div>
                </div>

                {/* Lock Tokens Section */}
                <div className="space-y-4 bg-[#1a1b23] p-4 sm:p-6 rounded-lg mt-6">
                  <div>
                    <label htmlFor="amountToLock" className="block text-sm font-medium text-gray-400 mb-3">
                      Amount to Lock (BOXBOX)
                    </label>
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() => setAmountToLock((prev) => (Math.max(0, Number(prev) - 100)).toString())}
                        className="absolute left-2 bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition"
                      >
                        ▼
                      </button>
                      <input
                        type="text"
                        id="amountToLock"
                        value={amountToLock ? formatNumber(Number(amountToLock)) : ""}
                        onChange={(e) => {
                          // Remove all non-numeric characters before setting the value
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          setAmountToLock(numericValue);
                        }}
                        min="0"
                        max={tokenBalance.toString()}
                        step="100"
                        className="w-full px-14 py-3 bg-[#24252d] rounded-md border border-gray-600 text-white text-center text-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                      />
                      <button
                        type="button"
                        onClick={() => setAmountToLock((prev) => Math.min(tokenBalance, Number(prev) + 100).toString())}
                        className="absolute right-2 bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition"
                      >
                        ▲
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleLockTokens}
                    disabled={
                      isProcessing || !amountToLock || Number.parseFloat(amountToLock) <= 0 || NUMBER_OF_TX === MAX_ACTIVE_VAULTS
                    }
                    className={`w-full py-4 rounded-md flex items-center justify-center transition-colors text-lg font-semibold ${
                      isProcessing || !amountToLock || Number.parseFloat(amountToLock) <= 0 || NUMBER_OF_TX === MAX_ACTIVE_VAULTS
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-yellow-500 hover:bg-yellow-400 text-black"
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <p>Processing...</p>
                      </div>
                    ) : (
                      <>
                        <LockIcon className="mr-2 h-5 w-5" />
                        Lock Tokens
                      </>
                    )}
                  </button>
                </div>

                {/* Active Locks Section */}
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold">Active Locks</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {locks.filter((lock) => lock.isLocked).length === 0 ? (
                      <p className="text-gray-400 col-span-full">There are no active locks.</p>
                    ) : (
                      locks
                        .filter((lock) => lock.isLocked)
                        .map((lock) => (
                          <div key={lock.id} className="bg-[#1a1b23] p-4 rounded-lg">
                            <div className="space-y-3">
                              <div>
                                <span className="text-gray-400 text-sm">Locked Amount</span>
                                <span className="text-lg sm:text-xl font-semibold block mt-1">{formatNumber(lock.amount)} BOXBOX</span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-sm">Release Date</span>
                                <span className="text-base block mt-1">{lock.releaseDate.toLocaleString()}</span>
                              </div>
                              <button
                                onClick={() => handleUnlockTokens(lock.id)}
                                disabled={unlockingLockId === lock.id || !lock.canUnlock}
                                className={`w-full py-3 rounded-md flex items-center justify-center transition-colors ${
                                  unlockingLockId === lock.id || !lock.canUnlock
                                    ? "bg-gray-600 cursor-not-allowed"
                                    : "bg-yellow-500 hover:bg-yellow-400 text-black"
                                }`}
                              >
                                <div className="flex items-center">
                                  {unlockingLockId === lock.id ? (
                                    <p>Unlocking...</p>
                                  ) : lock.canUnlock ? (
                                    <>
                                      <UnlockIcon className="mr-2 h-5 w-5" />
                                      <p>Unlock Tokens</p>
                                    </>
                                  ) : (
                                    <>
                                      <LockIcon className="mr-2 h-5 w-5" />
                                      <p>Locked</p>
                                    </>
                                  )}
                                </div>
                              </button>
                              <small className="text-gray-50 text-xs block mt-2 text-center font-medium">
                                ⚠️ Keep at least <span className="font-semibold">0.01 SOL</span> in your wallet for
                                {lock.canUnlock ? " unlocking" : " future unlocking"} gas fee.
                              </small>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Unlocked Tokens Section */}
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold">Unlocked Tokens</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {locks.filter((lock) => !lock.isLocked).length === 0 ? (
                      <p className="text-gray-400 col-span-full">There are no unlocked tokens.</p>
                    ) : (
                      locks
                        .filter((lock) => !lock.isLocked)
                        .map((lock) => (
                          <div key={lock.id} className="bg-[#1a1b23] p-4 rounded-lg">
                            <div>
                              <span className="text-gray-400 text-sm">Unlocked Amount</span>
                              <span className="text-lg sm:text-xl font-semibold block mt-1">{formatNumber(lock.amount)} BOXBOX</span>
                            </div>
                            <div className="mt-3">
                              <span className="text-gray-400 text-sm">Unlocked Date</span>
                              <span className="text-base block mt-1">{lock.releaseDate.toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Not Connected State */}
        {!wallet && (
          <div className="backdrop-blur-sm bg-black/20 rounded-b-xl shadow-lg w-full overflow-hidden p-6 text-center">
            <p className="text-lg sm:text-xl font-medium text-gray-300 mb-3">
              Connect your wallet to lock your BOXBOX tokens.
            </p>
            <small className="text-sm text-gray-400 max-w-lg mx-auto block">
              On your first wallet connection, your membership account and vault are automatically created. This requires approval for two transactions to cover the costs, so keep at least 0.001 SOL in your wallet.
            </small>
          </div>
        )}
      </div>
    </div>
  )
}

export default BoxBoxInterface

import { useState, useCallback, useRef } from 'react'
import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'
import { CONTRACT_ADDRESS } from '../config'

const DEPLOYER_KEY = import.meta.env.VITE_DEPLOYER_KEY

export function useGenLayer() {
  const [account, setAccount] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [txPending, setTxPending] = useState(false)
  const [error, setError] = useState(null)

  const clientRef = useRef(null)
  const deployerRef = useRef(null)

  function getClient() {
    if (!clientRef.current) {
      clientRef.current = createClient({ chain: studionet })
    }
    return clientRef.current
  }

  function getDeployer() {
    if (!deployerRef.current) {
      deployerRef.current = DEPLOYER_KEY ? createAccount(DEPLOYER_KEY) : createAccount()
    }
    return deployerRef.current
  }

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        if (accounts[0]) {
          setAccount(accounts[0])
          return accounts[0]
        }
      }
      const dep = getDeployer()
      setAccount(dep.address)
      return dep.address
    } catch (err) {
      const dep = getDeployer()
      setAccount(dep.address)
      return dep.address
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const readContract = useCallback(async (functionName, args = []) => {
    const client = getClient()
    return await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args,
    })
  }, [])

  const writeContract = useCallback(async (functionName, args = []) => {
    if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      throw new Error('Contract not deployed. Set VITE_CONTRACT_ADDRESS in .env and restart.')
    }
    setTxPending(true)
    setError(null)
    try {
      const client = getClient()
      const deployer = getDeployer()

      const txHash = await client.writeContract({
        account: deployer,
        address: CONTRACT_ADDRESS,
        functionName,
        args,
        value: 0,
      })

      await client.waitForTransactionReceipt({
        hash: txHash,
        status: TransactionStatus.ACCEPTED,
        fullTransaction: false,
      })

      return { txHash, status: 'ACCEPTED' }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setTxPending(false)
    }
  }, [])

  return { account, isConnecting, txPending, error, setError, connect, readContract, writeContract }
}

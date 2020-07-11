// This file contains the service methods for interacting with the ENS contracts on any of the supported chains.
// This file assumes 
import { ethers } from 'ethers'

const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

// Queries the `recordExists` function in the registry contract
export async function nameExists(name: string): Promise<boolean> {
    const { ethereum } = window as any
    const provider = new ethers.providers.Web3Provider(ethereum)

    return provider.resolveName(name).then(addr => {
        console.log(`ens.ts: ens.resolveName(${name}) returned: ${addr}`)
        return !!addr
    }).catch(err => {
        console.log(`There was an error resolving this ENS name: ${name}. ${err.toString()}`)
        return false
    })
}

// Queries the `resolver` function in the registry contract, returns a boolean if a resolver is set
function resolverSet(name: string): boolean {
    return false
}

// Returns the address of a resolver contract
function getResolver(name: string): string {
    return ''
}

// Queries a resolver contract to see if it supports a specific set of functions (EIP-165 supportsInterface)
function checkSupportsInterface(resolverAddress: string, interfaceId: string): boolean {
    return false
}

// Queries a resolver contract for an Ethereum address
export async function getAddr(name: string): Promise<string> {
    const { ethereum } = window as any
    const provider = new ethers.providers.Web3Provider(ethereum)

    return provider.resolveName(name).then(addr => {
        console.log(`ens.ts: ens.resolveName(${name}) returned: ${addr}`)
        return addr
    })
}

// Queries a resolver contract for a TokenID
function getTokenId(name: string, resolverAddress: string): string {
    return ''
}
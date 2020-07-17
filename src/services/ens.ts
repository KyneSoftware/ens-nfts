// This file contains the service methods for interacting with the ENS contracts on any of the supported chains.
// This file assumes 
import { ethers } from 'ethers'
import namehash from 'eth-ens-namehash'
import ensAbi from '../abis/ens-registry.json'
import eip2381ResolverAbi from '../abis/eip2381-resolver.json'

const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

// Queries the `recordExists` function in the registry contract
export async function nameExists(name: string): Promise<boolean> {
    const { ethereum } = window as any
    const provider = new ethers.providers.Web3Provider(ethereum)

    return provider.resolveName(name).then(addr => {
        // console.log(`ens.ts: ens.resolveName(${name}) returned: ${addr}`)
        return !!addr
    }).catch(err => {
        console.log(`There was an error resolving this ENS name: ${name}. ${err.toString()}`)
        return false
    })
}

// Queries the `resolver` function in the registry contract, returns a boolean if a resolver is set
export async function resolverSet(name: string): Promise<boolean> {
    const { ethereum } = window as any
    const provider = new ethers.providers.Web3Provider(ethereum)
    const ens = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensAbi, provider);
    const hash = namehash.hash(name)

    // console.log(`ens.ts: Resolver Set for: ${name}? (Namehash: ${hash})`)
    // console.log(ens)

    return await ens.resolver(hash).then((addr: any) => {
        console.log('Ens.resolver has returned: ')
        console.log(addr)
        return !!addr
    })
}

// Returns the address of a resolver contract
export async function getResolver(name: string): Promise<string> {
    const { ethereum } = window as any
    const provider = new ethers.providers.Web3Provider(ethereum)
    const ens = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensAbi, provider);
    const hash = namehash.hash(name)

    // console.log(`ens.ts: Resolver Set for: ${name}? (Namehash: ${hash})`)
    // console.log(ens)

    // Call the resolver method of the ENS registry, which has prototype: function(node bytes32) returns addr
    return await ens.resolver(hash).then((addr: any) => {
        console.log(`The address of the resolver contract for this name is: ${addr.toString()}`)
        return addr
    })
}

// Queries a resolver contract to see if it supports a specific set of functions (EIP-165 supportsInterface)
export async function checkSupportsInterface(resolverAddress: string, interfaceId: string): boolean {
    const { ethereum } = window as any
    const provider = new ethers.providers.Web3Provider(ethereum)
    const resolver = new ethers.Contract(resolverAddress, eip2381ResolverAbi, provider);
    const supports2381 = await resolver.supportsInterface(interfaceId)
    console.log(`supportsInterface for contract: ${resolverAddress} with interface: ${interfaceId} resulted in: ${supports2381}`)
    return !!supports2381
}

// Queries a resolver contract for an Ethereum address
export async function getAddr(name: string): Promise<string> {
    const { ethereum } = window as any
    const provider = new ethers.providers.Web3Provider(ethereum)

    return await provider.resolveName(name).then(addr => {
        console.log(`ens.ts: ens.resolveName(${name}) returned: ${addr}`)
        return addr
    })
}

// Queries a resolver contract for a TokenID
export async function getTokenId(name: string, resolverAddress: string): string {
    const { ethereum } = window as any
    const provider = new ethers.providers.Web3Provider(ethereum)
    const resolver = new ethers.Contract(resolverAddress, eip2381ResolverAbi, provider);
    const hash = namehash.hash(name)
    return resolver.tokenID(hash).then((tokenId: any) => {
        console.log(`getTokenId for resolver contract: ${resolverAddress} with ens name: ${name} resulted in: ${tokenId.toString()}`)
        return tokenId.toString()
    }).catch((err: any) => {
        console.log(`This isn't a resolver contract that supports EIP2381, cannot query .tokenID() function.`)
        throw err
    })

}
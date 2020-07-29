// This file contains the service methods for interacting with the ENS contracts on any of the supported chains.
// This file assumes 
import { ethers } from 'ethers'
import namehash from 'eth-ens-namehash'
import ensAbi from '../abis/ens-registry.json'
import eip2381ResolverAbi from '../abis/eip2381-resolver.json'
import erc721Abi from '../abis/erc721-abi.json'

const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

// Queries the `recordExists` function in the registry contract
export async function nameExists(name: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const ens = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensAbi, provider);
    const hash = namehash.hash(name)

    return ens.recordExists(hash).then((exists: boolean) => {
        console.log(`ens.ts: ens.recordExists(${name}) returned: ${exists}`)
        return !!exists
    }).catch((err: any) => {
        console.log(`There was an error resolving this ENS name: ${name}. ${err.toString()}`)
        return false
    })
}

// Retrieves the code for an address to infer that it is a contract and that it exists (Code != '0x')
export async function contractExists(address: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)

    return provider.getCode(address).then((code) => {
        console.log(`ens.ts(contractExists): ${address} exists on this network. ${!!code.toString()}. Code: ${code.toString()}`)
        return !!code && code !== '0x'
    }).catch((err: any) => {
        console.log(`ens.ts(contractExists): There was an error checking if ${address} exists on the network.`)
        console.error(err)
        return false
    })
}

// Checks if a token exists on an erc721 contract
export async function tokenExists(address: string, token: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const contract = new ethers.Contract(address, erc721Abi , provider);

    return contract.ownerOf(token).then((owner: any) => {
        console.log(`ens.ts(tokenExists): ${token} in ${address} exists on this network. ${!!owner.toString()}. Token Owner: ${owner.toString()}`)
        return !!owner && owner !== '0x0000000000000000000000000000000000000000'
    }).catch((err: any) => {
        console.log(`ens.ts(tokenExists): There was an error checking if ${token} exists within ${address} on the network.`)
        console.error(err)
        return false
    })
}

// Queries the `resolver` function in the registry contract, returns a boolean if a resolver is set
export async function resolverSet(name: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
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
    const { ethereum } = typeof window !== `undefined` ? window as any : null
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
export async function checkResolverSupportsInterface(resolverAddress: string, interfaceId: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const resolver = new ethers.Contract(resolverAddress, eip2381ResolverAbi, provider);
    const supports2381 = await resolver.supportsInterface(interfaceId)
    console.log(`supportsInterface for contract: ${resolverAddress} with interface: ${interfaceId} resulted in: ${supports2381}`)
    return !!supports2381
}

// Queries a resolver contract for an Ethereum address
export async function getAddr(name: string): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)

    return await provider.resolveName(name).then(addr => {
        console.log(`ens.ts: ens.resolveName(${name}) returned: ${addr}`)
        return addr
    })
}

// Queries a resolver contract for a TokenID
export async function getTokenId(name: string, resolverAddress: string): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
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

// Queries the owner of an ENS name
export async function getEnsOwner(name: string): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const ens = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensAbi, provider);
    const hash = namehash.hash(name)
    return ens.owner(hash).then((address: any) => {
        console.log(`getEnsOwner for name: ${name} resulted in: ${address.toString()}`)
        return address.toString()
    }).catch((err: any) => {
        console.log(`Failed to query the ENS registry for the owner of ${name}`)
        throw err
    })
}

// Queries if the passed address is the owner of an ENS name
export async function isEnsAdmin(name: string, address: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const ens = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensAbi, provider);
    const hash = namehash.hash(name)
    return ens.owner(hash).then((addr: any) => {
        console.log(`getEnsOwner for name: ${name} resulted in: ${addr.toString()}`)
        return addr.toString() === address
    }).catch((err: any) => {
        console.log(`Failed to query the ENS registry for the owner of ${name}`)
        throw err
    })
}

// Queries the ownerOf function of the NFT contract
export async function getNftOwner(contract: string, tokenId: string): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const nftContract = new ethers.Contract(contract, erc721Abi, provider);

    return nftContract.ownerOf(tokenId).then((address: any) => {
        console.log(`getNftOwner for contract address: ${contract} and tokenId: ${tokenId}, resulted in: ${address.toString()}`)
        return address.toString()
    }).catch((err: any) => {
        console.log(`Failed to query the nftContract ${contract} for the ownerOf ${tokenId}`)
        throw err
    })
}

// Queries unknown contract with a supportsInterface call
export async function checkContractSupportsInterface(contractAddress: string, contractInterface: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const contract = new ethers.Contract(contractAddress, erc721Abi , provider);

    return await contract.supportsInterface(contractInterface).then((supported: boolean) => {
        console.log(`Querying does ${contractAddress} support interface ${contractInterface}. ${supported.toString()}`)
        return !!supported
    }).catch((err: any) => {
        console.log(`Failed to query the supportsInterface method of  ${contractAddress} for the interface ${contractInterface}`)
        console.error(err)
        throw err
    })
}
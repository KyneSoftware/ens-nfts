// This file contains the service methods for interacting with the ENS contracts on any of the supported chains.
// This file assumes 
import { ethers } from 'ethers'
import namehash from 'eth-ens-namehash'
import ensAbi from '../abis/ens-registry.json'
import eip2381ResolverAbi from '../abis/eip2381-resolver.json'
import erc721Abi from '../abis/erc721-abi.json'
import { formatBytes32String, parseBytes32String } from 'ethers/lib/utils'
import { logger } from '../config/pino';

const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const ENS_NFT_RESOLVERS = [
    'No-NetworkID-0',
    '0xb2eef9d0235a339179a7e177e818439dcca9d76e',
    'No-NetworkId-2',
    '0xf39f73b0c748d284dcea3f0da8bbdefa7a789c6b',
    '0x9d5dd30b5d77665f0c2f082cccc077d349ba1afc',
    '0x2618f1ed8590cb750489ce5de0d1c05d8375bbdf',
]
// Queries the `recordExists` function in the registry contract
export async function nameExists(name: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const ens = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensAbi, provider);
    const hash = namehash.hash(name)

    return ens.recordExists(hash).then((exists: boolean) => {
        logger.debug(`ens.ts: ens.recordExists(${name}) returned: ${exists}`)
        return !!exists
    }).catch((err: any) => {
        logger.warn(`There was an error resolving this ENS name: ${name}. ${err.toString()}`)
        return false
    })
}

// Retrieves the code for an address to infer that it is a contract and that it exists (Code != '0x')
export async function contractExists(address: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)

    return provider.getCode(address).then((code) => {
        logger.info(`ens.ts(contractExists): ${address} exists on this network. ${!!code.toString()}. Code: ${code.toString()}`)
        return !!code && code !== '0x'
    }).catch((err: any) => {
        logger.warn(`ens.ts(contractExists): There was an error checking if ${address} exists on the network.`)
        console.error(err)
        return false
    })
}

// Checks if a token exists on an erc721 contract
export async function tokenExists(address: string, token: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const contract = new ethers.Contract(address, erc721Abi, provider);

    return contract.ownerOf(token).then((owner: any) => {
        logger.info(`ens.ts(tokenExists): ${token} in ${address} exists on this network. ${!!owner.toString()}. Token Owner: ${owner.toString()}`)
        return !!owner && owner !== '0x0000000000000000000000000000000000000000'
    }).catch((err: any) => {
        logger.warn(`ens.ts(tokenExists): There was an error checking if ${token} exists within ${address} on the network.`)
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
        logger.debug('Ens.resolver has returned: ')
        logger.debug(addr)
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
        logger.info(`The address of the resolver contract for this name is: ${addr.toString()}`)
        return addr
    })
}

// Sets a resolver contract to the const resolver address in this file
export async function setResolver(name: string): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const ens = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensAbi, signer);
    const hash = namehash.hash(name)
    const chainId = (await provider.getNetwork()).chainId

    if(!(chainId === 1 || chainId === 3 || chainId === 4 || chainId === 5)){
        throw new Error('Unknown chain Id, no resolver contract on this network.')
    }
    const resolverContract = ENS_NFT_RESOLVERS[chainId]

    logger.info(`ens.ts: Set new resolver for: ${name}? (Namehash: ${hash}) on chain: ${chainId} to resolverContract: ${resolverContract} with signer: ${JSON.stringify(signer)}`)

    // Call the setResolver method of the ENS registry, which has prototype: setResolver(bytes32 node, address resolver)
    return await ens.setResolver(hash, resolverContract).then((response: any) => {
        console.log(`The address of the resolver contract for this name is: ${response.toString()}`)
        return response
    })
}

// Queries a resolver contract to see if it supports a specific set of functions (EIP-165 supportsInterface)
export async function checkResolverSupportsInterface(resolverAddress: string, interfaceId: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const resolver = new ethers.Contract(resolverAddress, eip2381ResolverAbi, provider);
    return await resolver.supportsInterface(interfaceId).then((supports: boolean) => {
        logger.info(`supportsInterface for contract: ${resolverAddress} with interface: ${interfaceId} resulted in: ${supports}`)
        return !!supports
    }).catch((err: any) => {
        logger.warn(`Failed to query the supportsInterface method of  ${resolverAddress} for the interface ${interfaceId}`)
        console.error(err)
        return false
    })
}

// Queries a resolver contract for an Ethereum address
export async function getAddr(name: string): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)

    return await provider.resolveName(name).then(addr => {
        logger.info(`ens.ts: ens.resolveName(${name}) returned: ${addr}`)
        return addr
    })
}

// Sets a resolver contract to an Ethereum address
export async function setAddr(name: string, address: string): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const resolverAddress = await getResolver(name)
    const resolver = new ethers.Contract(resolverAddress, eip2381ResolverAbi, signer);
    const hash = ethers.utils.namehash(name)
    const hexstring = ethers.utils.hexlify(hash)
    logger.debug(`Calling resolver ${resolverAddress} to set address: ${address.toString()}. Node hash: ${hexstring.toString()}. `)
    // Set the resolver to resolve ${name} to ${address}
    return await resolver["setAddr(bytes32,address)"](hash, address).then(() => {
        console.log(`ens.ts: ens.setAddr(${name})`)
        return
    })
}
// Queries a resolver contract for a TokenID
export async function getTokenId(name: string, resolverAddress: string): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const resolver = new ethers.Contract(resolverAddress, eip2381ResolverAbi, provider);
    const hash = namehash.hash(name)
    return resolver.tokenID(hash).then((tokenId: any) => {
        logger.info(`getTokenId for resolver contract: ${resolverAddress} with ens name: ${name} resulted in: ${tokenId.toString()}`)
        return tokenId.toString()
    }).catch((err: any) => {
        logger.warn(`This isn't a resolver contract that supports EIP2381, cannot query .tokenID() function.`)
        throw err
    })
}

// Sets a resolver's `tokenID` field
export async function setTokenId(name: string, tokenId: string, resolverAddress: string ): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const resolver = new ethers.Contract(resolverAddress, eip2381ResolverAbi, signer);
    const hash = namehash.hash(name)
    const strippedHash = hash.substring(2)
    const strippedHashArray = strippedHash.split('')
    
    logger.info(`Calling resolver ${resolverAddress} to set tokenID. Node hash: ${strippedHashArray.toString()}. Length: ${strippedHash.length.toString()}`)
    logger.debug(JSON.stringify(resolver))
    // Set the resolver to resolve ${name} to ${tokenID}

    return await resolver.setTokenID(hash, tokenId).then(() => {
        console.log(`ens.ts: ens.setAddr(${name})`)
        return
    })
}

// Queries the owner of an ENS name
export async function getEnsOwner(name: string): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const ens = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensAbi, provider);
    const hash = namehash.hash(name)
    return ens.owner(hash).then((address: any) => {
        logger.info(`getEnsOwner for name: ${name} resulted in: ${address.toString()}`)
        return address.toString()
    }).catch((err: any) => {
        logger.warn(`Failed to query the ENS registry for the owner of ${name}`)
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
        logger.info(`getEnsOwner for name: ${name} resulted in: ${addr.toString()}`)
        return addr.toString() === address
    }).catch((err: any) => {
        logger.warn(`Failed to query the ENS registry for the owner of ${name}`)
        throw err
    })
}

// Queries the ownerOf function of the NFT contract
export async function getNftOwner(contract: string, tokenId: string): Promise<string> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const nftContract = new ethers.Contract(contract, erc721Abi, provider);

    return nftContract.ownerOf(tokenId).then((address: any) => {
        logger.info(`getNftOwner for contract address: ${contract} and tokenId: ${tokenId}, resulted in: ${address.toString()}`)
        return address.toString()
    }).catch((err: any) => {
        logger.warn(`Failed to query the nftContract ${contract} for the ownerOf ${tokenId}`)
        throw err
    })
}

// Queries unknown contract with a supportsInterface call
export async function checkContractSupportsInterface(contractAddress: string, contractInterface: string): Promise<boolean> {
    const { ethereum } = typeof window !== `undefined` ? window as any : null
    const provider = new ethers.providers.Web3Provider(ethereum)
    const contract = new ethers.Contract(contractAddress, erc721Abi, provider);

    return await contract.supportsInterface(contractInterface).then((supported: boolean) => {
        logger.info(`Querying does ${contractAddress} support interface ${contractInterface}. ${supported.toString()}`)
        return !!supported
    }).catch((err: any) => {
        logger.warn(`Failed to query the supportsInterface method of  ${contractAddress} for the interface ${contractInterface}`)
        console.error(err)
        throw err
    })
}
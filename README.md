![Kyne Software Logo](./static/SocialPreviewKS.png)

<h1 align="center">
  Name your Ethereum NFT with ENS
</h1>


<p align="center">
  <img src="https://github.com/KyneSoftware/ens-nfts/actions/workflows/main.yaml/badge.svg" />
</p>
<p align="center">An extension to EIP-721 making NFTs addressable by the Ethereum Name Service</p>

## Proposal

The Ethereum Name Service (ENS) is a valuable piece of the Ethereum infrastructure. Much like DNS bridges the human readable with the computer readable for internet addresses; ENS puts human friendly names on top of Ethereum addresses. 

But an ENS name can contain more information that just an ethereum address. An ENS resolver can address:
- Externally owned addresses
- Ethereum Contracts
- Public Keys
- IPFS content
- Tokens
- Contract ABIs
- DNS records
- General key:value pairs of strings

But there was one thing I found was missing. You can point a name at an ERC20 token, and all is well, you don't need to differentiate between one ERC20 and the other. But for non-fungible tokens, you want to be able to differentiate one from the other in a meaningful manner. This was the impetus behind creating [EIP 2381](https://github.com/ethereum/EIPs/pull/2381). 

This repo is a lightweight front end for setting ENS names to point at individual NFTs within an ERC721 contract. Use this site to set ENS names for your most valuable non-fungibles, to really help people appreciate the one-of-a-kind nature of your token. People already know domain names are unique, use that to make your tokens more unique. 

### What is EIP 2381?

[EIP 2381](https://github.com/ethereum/EIPs/pull/2381) is a small extension to the ENS spec which adds another resolver profile `tokenId`. This allows an ENS resolver contract to return both an address and a tokenID for a given name, allowing the naming scheme to differentiate individual NFTs within an ERC721 contract.

```
  function tokenID(bytes32 node) public view returns(uint256);
  function setTokenID(bytes32 node, uint256 token);
```

### How to tell if a given ENS name points at an NFT? 

If you support ENS names in your application, and you want to add in NFT support with EIP2381, here is how you should go about resolving an ENS name. 
- Given an ENS name, first look up it's resolver contract.
- Given an ENS name and it's resolver contract, look up it's `addr` field, which returns an address if one is set. 
- Check if this address is an **ERC721 contract**, by using EIP165's `supportsInterface` method. (ERC721 interface ID is `0x80ac58cd`).
- If this address is an ERC721 contract, now you should check whether this name is pointing at the entire NFT contract, or whether it is pointing at a specific NFT within it. 
- First, check if the **resolver contract** supports EIP2381, by using EIP165's `supportsInterface` method. (EIP2381 interface ID is `0x4b23de55`).
  - If the resolver contract *does not support* EIP2381, you can safely assume this name does not address a specific NFT within the ERC721 contract.
  - If the resolver contract *does support* EIP2381, you should call the function: `tokenID(bytes32 node)` on the resolver contract.
    - If the `tokenID` function returns 0, you can assume that this name is not addressing a specific NFT. (0 is not a valid tokenID in the ERC721 standard).
    - If the `tokenID` function returns a non-zero value, this name is addressing a specific NFT within the contract.
- If a `tokenID` is set on the resolver contract, it is advised that you verify that this `tokenID` exists within the ERC721 contract, and hasn't been burned or never been minted, for example.

## Quickstart

This repo uses Gatsby.js as a build tool that makes server side rendering-capable static webpages, that can then instantiate themselves as React Webpages when loaded on the client side. This allows for faster loading of web pages. To get started:

```bash
# Local development
npm run develop

# Tests
npm run test
```

## To Do
- [ ] Handle the crash if you try and set a name to a cryptopunk
- [ ] Set repo public
- [ ] Pull NFT Metadata and render after a search

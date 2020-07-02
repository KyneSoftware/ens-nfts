<h1 align="center">
  Name your Ethereum NFT with ENS
</h1>

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

But there was one thing I found was missing. You can point a name at an ERC20 token, and all is well, you don't need to differentiate between one ERC20 and the other. But for non-fungible tokens, you want to be able to differentiate one from the other in a meaningful manner. This was the impetus behind creating [EIP2381](https://github.com/ethereum/EIPs/pull/2381). 

This repo is a lightweight front end for setting ENS names to point at individual NFTs within an ERC721 contract. Use this site to set ENS names for your most valuable non-fungibles, to really help people appreciate the one-of-a-kind nature of your token. People already know domain names are unique, use that to make your tokens more unique. 



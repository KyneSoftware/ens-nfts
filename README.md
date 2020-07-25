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

# What is EIP2381?

[EIP2381](https://github.com/ethereum/EIPs/pull/2381) is a small extension to the ENS spec which adds another resolver profile `tokenId`. This allows an ENS resolver contract to return both an address and a tokenID for a given name, allowing the naming scheme to differentiate individual NFTs within an ERC721 contract.

```
  function tokenID(bytes32 node) public view returns(uint256);
  function setTokenID(bytes32 node, uint256 token);
```

## To Do
- [ ] Rebrand to nft.kyne.eu
- [ ] Deploy it to the web
- [ ] Get an SSL cert sorted
- [ ] Get the set a name working
    - [ ] ENS Name field should query the existence of the name in the registry
    - [ ] NFT contract address should query the contract exists and responds to ERC165 asking if its an NFT
    - [ ] Token ID should check if it exists in the NFT
    - [ ] Set Name should launch a confirmation modal
    - [ ] Confirmation modal should launch a metamask transaction
- [ ] Make a robust readme describing EIP2381
- [x] Get a metamask icon above the connect metamask button
- [ ] Get colour schemes fixed up (primary + secondary, snackbars)
- [x] Get a better NFT found display (flashy icon, no line wrapping, maybe getting NFT metadata?)
- [x] Get click to copy to clipboard buttons working for NFT found data
- [ ] Have search and set buttons disabled until metamask is connected

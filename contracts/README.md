# ENS NFT Controller Smart Contract (Considered)

When a new user wants to set the name of an NFT. The need to come to this site with an ENS subdomain already created. This site will then. 

- Update the ENS name to point at an EIP-2381 supporting resolver contract.
- Set that resolver contract to resolve the ENS name to the NFT Contract Address. 
- Set that resolver contract to return the appropriate `tokenID` for the NFT. 

These three updates currently need three separate metamask transactions, that's not great UX. Instead, this smart contract will do all three in one. 


Actually, this approach would require you to trust this controller contract as an editor of the ENS registry for you, I don't want to do that right now. 
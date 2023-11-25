import {
    Box, Button, Center, Flex, Heading, Image, Input, SimpleGrid, Text,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState, useEffect, useRef } from 'react';
// import { createWeb3Modal, defaultConfig, useWeb3ModalAccount, Web3Modal, Web3Provider } from '@web3modal/ethers5/react'
import { ConnectButton } from "./ConnectButton.jsx"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ethers } from "ethers"
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5"
import { useWeb3ModalAccount } from "@web3modal/ethers5/react"
// import { Web3Modal } from "@web3modal/ethers5/dist/esm/src/client.js"

// Ideally we'd use some more secure ways of obtaining these values
const GOERLI_API_KEY = "8W7zKgmn4QUHaEdD_leww7KUQOpYphSd"
const GOERLI_RPC_URL = "https://eth-goerli.g.alchemy.com/v2/8W7zKgmn4QUHaEdD_leww7KUQOpYphSd"

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = 'd671bd1a92461f4de8a4d2320f541e54'

// 2. Set chains
const mainnet = {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://cloudflare-eth.com'
}

const goerli = {
    chainId: 5, name: 'GEthereum', currency: 'ETH', explorerUrl: 'https://goerli.etherscan.io/', rpcUrl: GOERLI_RPC_URL
}

// 3. Create modal
const metadata = {
    name: 'ERC-20 Indexer',
    description: 'List ERC-20 contracts in given wallet',
    url: 'https://artsyfartsy.com/',
    icons: ['https://artsyfartsy.com/']
}

createWeb3Modal({
    ethersConfig: defaultConfig({ metadata }), chains: [goerli], projectId
})

// const web3Modal = new Web3Modal()
// const connection = await web3Modal.connect()
// const provider = new ethers.providers.Web3Provider(connection)
function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value; //assign the value of ref to the argument
    },[value]); //this code will run when the value of 'value' changes
    return ref.current; //in the end, return the current ref value.
}

function App() {
    const [userAddress, setUserAddress] = useState('');
    // const [lastUserAddress, setLastUserAddress] = useState('');
    const lastUserAddress = usePrevious(userAddress);
    const [results, setResults] = useState([]);
    const [hasQueried, setHasQueried] = useState(false);
    const [tokenDataObjects, setTokenDataObjects] = useState([]);
    const { address: walletConnectAddress, chainId, isConnected } = useWeb3ModalAccount();
    const [ showIsAddrError, setShowIsAddrError ]= useState(false);

    useEffect(() => {
        console.log(`walletConnectAddress changed: ${walletConnectAddress}`);
        setShowIsAddrError(false);
        if (walletConnectAddress != null) {
            setUserAddress(walletConnectAddress);
        } else {
            setResults({ tokenBalances: [] })
            setUserAddress('')
        }
    }, [walletConnectAddress]);

    useEffect(() => {
        console.log(`results:`)
        console.log(`${JSON.stringify(results, null, 2)}`)
    }, [results])

    useEffect(() => {
        setShowIsAddrError(false);
        console.log(`address changed: ${userAddress}`);
        getTokenBalance();
    }, [userAddress])

    async function getTokenBalance() {
        const haveString = (str) => str != null && str.length > 0;
        const isENS = (addr) => addr.search(/\.eth$/) > -1;
        const isPublicKey = (addr) => ethers.utils.isAddress(addr);

        const config = {
            apiKey: '8W7zKgmn4QUHaEdD_leww7KUQOpYphSd', network: Network.ETH_GOERLI,
        };
        const alchemy = new Alchemy(config);

        if (!haveString(userAddress) && !(isENS(userAddress) || isPublicKey(userAddress))) {
            return;
        }
        console.log(`address: ${userAddress}`)
        // setShowIsAddrError(false);
        if (isENS(userAddress)) {
            const origAddr = userAddress;
            const address = await alchemy.core.resolveName(userAddress);
            if (!haveString(address)) {
                console.log(`lookup for ${origAddr} failed`)
                toast.error(`lookup for ${origAddr} as ENS failed`);
                return;
            }
            console.log(`lookup for ${origAddr} - ${address}`);
            setUserAddress(address);
        }
        if (userAddress != lastUserAddress && isPublicKey(userAddress)) {
            // setLastUserAddress(userAddress);
            const data = await alchemy.core.getTokenBalances(userAddress);    //userAddress);

            setResults(data);

            const tokenDataPromises = [];

            for (let i = 0; i < data.tokenBalances.length; i++) {
                const tokenData = alchemy.core.getTokenMetadata(data.tokenBalances[i].contractAddress);
                tokenDataPromises.push(tokenData);
            }

            setTokenDataObjects(await Promise.all(tokenDataPromises));
            setHasQueried(true);
        } else {
            if (! isPublicKey(userAddress)) {
                setShowIsAddrError(true);
            }
        }
    }

    const errMessage = showIsAddrError ? <p className="Error">Unknown .eth or address</p> : <span></span>;
    return (<div>
        <ToastContainer/>
        <Flex color="white" flexDirection="column" borderWidth="1px">
            <Flex flexDirection="row">
                <Heading mb={20} fontSize={36}>
                    ERC-20 Token Indexer
                </Heading>
                <Box alignSelf='right' padding='10px'>
                    <ConnectButton/>
                </Box>
            </Flex>
            <Box>
                <Text>
                    Connect a wallet. Or enter an address and this website will return all of its ERC-20
                    token balances!
                </Text>
            </Box>
        </Flex>
        <Flex flexDirection="column">
            <Heading mt={42}>
                Get all the ERC-20 token balances of this address:
            </Heading>
            <Input
                onChange={(e) => {
                    console.log(`changed addr: ${e.target.value}`)
                    setUserAddress(e.target.value)
                }}
                color="black"
                w="600px"
                textAlign="left"
                p={4}
                bgColor="white"
                fontSize={24}
                value={userAddress}
                margin='20px'
            />
            {errMessage}
            <Box maxW="md">
                <Button fontSize={20} onClick={() => getTokenBalance(0)} mt={36} bgColor="blue">
                    Check ERC-20 Token Balances
                </Button>
            </Box>

            <Heading my={36}>ERC-20 token balances:</Heading>

            {hasQueried ? (<SimpleGrid w={'90vw'} columns={4} spacing={24}>
                {results.tokenBalances.map((e, i) => {
                    return (<Flex
                        flexDir={'column'}
                        color="black"
                        bg="lightyellow"
                        w={'20vw'}
                        key={e.contractAddress}
                    >
                        <Box>
                            <b>Symbol:</b> ${tokenDataObjects[i]?.symbol}&nbsp;
                        </Box>
                        <Box>
                            <b>Balance:</b>&nbsp;
                            {Utils.formatUnits(e.tokenBalance, tokenDataObjects[i]?.decimals)}
                        </Box>
                        <Image src={tokenDataObjects[i]?.logo}/>
                    </Flex>);
                })}
            </SimpleGrid>) : ('Please make a query! This may take a few seconds...')}
        </Flex>
    </div>);
}

export default App;

import {
    Box, Button, Center, Flex, Heading, Image, Input, SimpleGrid, Text,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState, useEffect } from 'react';
import { createWeb3Modal, defaultConfig, useWeb3ModalAccount } from '@web3modal/ethers5/react'
import { ConnectButton } from "./ConnectButton.jsx"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

function App() {
    const [userAddress, setUserAddress] = useState('');
    const [results, setResults] = useState([]);
    const [hasQueried, setHasQueried] = useState(false);
    const [tokenDataObjects, setTokenDataObjects] = useState([]);
    const { address, chainId, isConnected } = useWeb3ModalAccount();
    const [lastAddress, setLastAddress] = useState();   // prevent it keeping on performing lookup

    useEffect(() => {
        console.log(`Address changed: ${address}`);
        if (address != null) {
            getTokenBalance(address);
        } else {
            setResults({ tokenBalances: [] })
        }
    }, [address]);

    useEffect(() => {
        console.log(`results:`)
        console.log(`${JSON.stringify(results, null, 2)}`)
    }, [results])

    async function getTokenBalance(passedAddress) {
        const haveString = (str) => str != null && str.length > 0;
        const config = {
            apiKey: '8W7zKgmn4QUHaEdD_leww7KUQOpYphSd', network: Network.ETH_GOERLI,
        };
        const alchemy = new Alchemy(config);

        let address = passedAddress || userAddress;
        if (!haveString(address)) {
            return;
        }
        console.log(`address: ${address} or ${JSON.stringify(Object.keys(address))}`)
        if (address.search(/^0x/) === -1) {
            const origAddr = address;
            address = await alchemy.core.resolveName(address);
            if (!haveString(address)) {
                console.log(`lookup for ${origAddr} failed`)
                toast.error(`lookup for ${origAddr} as ENS failed`);
                return;
            }
            console.log(`lookup for ${origAddr} - ${address}`);
        }
        if (address != lastAddress) {
            setLastAddress(address);
            const data = await alchemy.core.getTokenBalances(address);    //userAddress);

            setResults(data);

            const tokenDataPromises = [];

            for (let i = 0; i < data.tokenBalances.length; i++) {
                const tokenData = alchemy.core.getTokenMetadata(data.tokenBalances[i].contractAddress);
                tokenDataPromises.push(tokenData);
            }

            setTokenDataObjects(await Promise.all(tokenDataPromises));
            setHasQueried(true);
        }
    }

    return (<div>
        <ToastContainer/>
        {/*<Box w="100vw">*/}
        {/*<Flex*/}
        {/*    alignItems={'center'}*/}
        {/*    justifyContent="center"*/}
        {/*    flexDirection={'column'}*/}
        {/*>*/}
        <Flex color="white" flexDirection="column"  borderWidth="1px">
            {/*<Box borderWidth="1px">*/}
                <Flex flexDirection="row">
                        <Heading mb={20} fontSize={36}>
                            ERC-20 Token Indexer
                        </Heading>
                    <Box alignSelf='right'>
                        <ConnectButton/>
                    </Box>
                </Flex>
            {/*</Box>*/}
            <Box>
                <Text>
                    Connect a wallet.  Or enter an address and this website will return all of its ERC-20
                    token balances!
                </Text>
            </Box>
        </Flex>
        {/*</Box>*/}
        {/*<Box w="100vw">*/}
        {/*<Flex*/}
        {/*    w="100%"*/}
        {/*    flexDirection="column"*/}
        {/*    alignItems="center"*/}
        {/*    justifyContent={'center'}*/}
        {/*>*/}
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
                    value='booger'
                    margin='20px'
                />
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
        {/*// </Box>*/}
    </div>);
}

export default App;

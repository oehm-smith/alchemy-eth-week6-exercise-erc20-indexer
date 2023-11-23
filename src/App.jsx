import {
    Box,
    Button,
    Center,
    Flex,
    Heading,
    Image,
    Input,
    SimpleGrid,
    Text,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState, useEffect } from 'react';
import { createWeb3Modal, defaultConfig, useWeb3ModalAccount } from '@web3modal/ethers5/react'
import { ConnectButton } from "./ConnectButton.jsx"

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
    chainId: 5,
    name: 'GEthereum',
    currency: 'ETH',
    explorerUrl: 'https://goerli.etherscan.io/',
    rpcUrl: GOERLI_RPC_URL
}

// 3. Create modal
const metadata = {
    name: 'ERC-20 Indexer',
    description: 'List ERC-20 contracts in given wallet',
    url: 'https://artsyfartsy.com/',
    icons: ['https://artsyfartsy.com/']
}

createWeb3Modal({
    ethersConfig: defaultConfig({ metadata }),
    chains: [goerli],
    projectId
})

function App() {
    const [userAddress, setUserAddress] = useState('');
    const [results, setResults] = useState([]);
    const [hasQueried, setHasQueried] = useState(false);
    const [tokenDataObjects, setTokenDataObjects] = useState([]);
    const { address, chainId, isConnected } = useWeb3ModalAccount();

    const doCheckConnection = () => {
        const { lAddress, lChainId, lIsConnected } = useWeb3ModalAccount();
        setAddress(lAddress);
        setChainId(lChainId);
        setIsConnected(lIsConnected);
    }

    useEffect(() => {
        console.log(`Address changed: ${address}`);
        if (address != null) {
            getTokenBalance(address);
        } else {
            setResults({ tokenBalances: [] })
        }
    }, [address]);

    async function getTokenBalance(passedAddress) {
        const config = {
            apiKey: '8W7zKgmn4QUHaEdD_leww7KUQOpYphSd',
            network: Network.ETH_GOERLI,
        };

        const alchemy = new Alchemy(config);
        const data = await alchemy.core.getTokenBalances(passedAddress);    //userAddress);

        setResults(data);

        const tokenDataPromises = [];

        for (let i = 0; i < data.tokenBalances.length; i++) {
            const tokenData = alchemy.core.getTokenMetadata(
                data.tokenBalances[i].contractAddress
            );
            tokenDataPromises.push(tokenData);
        }

        setTokenDataObjects(await Promise.all(tokenDataPromises));
        setHasQueried(true);
    }

    return (
        <Box w="100vw">
            <Center>
                <ConnectButton/>
                <Flex
                    alignItems={'center'}
                    justifyContent="center"
                    flexDirection={'column'}
                >
                    <Heading mb={0} fontSize={36}>
                        ERC-20 Token Indexer
                    </Heading>
                    <Text>
                        Plug in an address and this website will return all of its ERC-20
                        token balances!
                    </Text>
                </Flex>
            </Center>
            <Flex
                w="100%"
                flexDirection="column"
                alignItems="center"
                justifyContent={'center'}
            >
                <Heading mt={42}>
                    Get all the ERC-20 token balances of this address:
                </Heading>
                <Input
                    onChange={(e) => setUserAddress(e.target.value)}
                    color="black"
                    w="600px"
                    textAlign="center"
                    p={4}
                    bgColor="white"
                    fontSize={24}
                />
                <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue">
                    Check ERC-20 Token Balances
                </Button>

                <Heading my={36}>ERC-20 token balances:</Heading>

                {hasQueried ? (
                    <SimpleGrid w={'90vw'} columns={4} spacing={24}>
                        {results.tokenBalances.map((e, i) => {
                            return (
                                <Flex
                                    flexDir={'column'}
                                    color="white"
                                    bg="blue"
                                    w={'20vw'}
                                    key={e.id}
                                >
                                    <Box>
                                        <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                                    </Box>
                                    <Box>
                                        <b>Balance:</b>&nbsp;
                                        {Utils.formatUnits(
                                            e.tokenBalance,
                                            tokenDataObjects[i].decimals
                                        )}
                                    </Box>
                                    <Image src={tokenDataObjects[i].logo}/>
                                </Flex>
                            );
                        })}
                    </SimpleGrid>
                ) : (
                    'Please make a query! This may take a few seconds...'
                )}
            </Flex>
        </Box>
    );
}

export default App;

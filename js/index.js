const connectWallet = document.querySelector('.unlock-wallet');
const totalLiquidityLocked = document.querySelector('.total-liquidity-locked');
const userBalance = document.querySelector('.user-balance');
const eligibleRewards = document.querySelector('.eligible-rewards');
const rewards = document.querySelector('.rewards');
const withdrawRewardsButton = document.querySelector('.withdraw-rewards');

import { abi as ethanolTokenABI } from '../contracts/Ethanol.js';
import { abi as ethanolVestABI } from "../contracts/EthanolVault.js";

// const apiKey = '7QEMXYNDAD5WT7RTA5TQUCJ5NIA99CSYVI';
const apiKey = 'T9RV3FGW573WX9YX45F1Z89MEMEUNQXUC7';
const EthanolAddress = '0x63D0eEa1D7C0d1e89d7e665708d7e8997C0a9eD6';
const EthnolVestAddress = '0xa566D7b91f2Fe2F1004f357b8F175365cb401D6c';


let totalGasUsed = 0;

const lpUserAddress = '0x3a2fb39f16afa7f745375d4181e80ee9f962ea90';


const ethanolStartBlocktime = 11297376;
let current_block_time;
let token_timestamp_bought;

let web3;
let EthanolToken;
let EthanoVault;
let user;

const toWei = _amount => web3.utils.toWei(_amount.toString(), 'ether');
const fromWei = _amount => web3.utils.fromWei(_amount.toString(), 'ether');

window.addEventListener('DOMContentLoaded', async () => {
  await connectDAPP();
})

const loadWeb3 = async () => {
    if(window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        // cancel autorefresh on network change
        window.ethereum.autoRefreshOnNetworkChange = false;

    } else if(window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
    } else {
        alert("Non-Ethereum browser detected. You should consider trying Metamask")
    }
}


const loadBlockchainData = async () => {
  try {
    web3 = window.web3;
    EthanolToken = new web3.eth.Contract(ethanolTokenABI, EthanolAddress);
    EthanoVault = new web3.eth.Contract(ethanolVestABI, EthnolVestAddress);
    const accounts = await web3.eth.getAccounts();
    user = accounts[0];
    await settings();
    
  } catch (error) { console.error(error.message); }
}


const connectDAPP = async () => {
    await loadWeb3();
    await loadBlockchainData();

    current_block_time = await latestBlockNumber();
    token_timestamp_bought = await getFirstTransaction();

    // await filterSearch()
}


const settings = async () => {
    if(user) connectWallet.classList.add('hide');

    totalLiquidityLocked.textContent = `$251,000`;

    let _balance = await balanceOf();
    userBalance.textContent = `${Number.parseFloat(fromWei(_balance)).toFixed(4)} Enol`;

    // const _lpRewards = await balanceOf(lpUserAddress);
    // totalCirulatingSuppy.textContent = `${Number.parseFloat(fromWei(_lpRewards)).toFixed(4)} Enol`;

    const _rewardsUSD = await filterSearch();
    rewards.textContent = `${Number.parseFloat(_rewardsUSD).toFixed(4)} USD`;

    _balance = await calculateRewards();
    eligibleRewards.textContent = `${_balance}%`;
}

const balanceOf = async _account => {
    const _user = _account ? _account : user;
    return await EthanolToken.methods.balanceOf(_user).call();
}

const withdrawRewards = async () => {
    try {
        const _rewards = await EthanoVault.methods.checkRewards(user).call();
        const reciept = await EthanoVault.methods.withdrawRewards(1).send(
            { from: user, gas: '25000' }
        );
        alert('Withdraw successful');
        console.log(reciept)
        return reciept;
    } catch (error) {
        alert(error.message);
    }
}


const latestBlockNumber = async () => {
    try {
        const result = (await fetch(`https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`)).json()
        return result;
    } catch (error) { console.error(error) }
}

const fetchTransactionList = async _startTime => {
    try {
        const result = (await fetch(
            `https://api.etherscan.io/api?module=account&action=txlist&address=${user}&startblock=${_startTime}&endblock=${current_block_time}&sort=asc&apikey=${apiKey}`
        )).json();
        return result;
    } catch (error) {
        console.error(error)
    }
}

const calculateRewards = async () => {
    try {
        const _balance = (await balanceOf(user)).toString();
        let result  = '0';
        if(Number(fromWei(_balance)) > '2' && Number(fromWei(_balance)) < '5') {
            result = '10';
        } else if(Number(fromWei(_balance)) >= '5' && Number(fromWei(_balance)) < '10') {
            result = '20'
        } else if(Number(fromWei(_balance)) >= '10' && Number(fromWei(_balance)) < '20') {
            result = '30'
        } else if(Number(fromWei(_balance)) >= '20' && Number(fromWei(_balance)) < '30') {
            result = '40'
        } else if(Number(fromWei(_balance)) >= '30' && Number(fromWei(_balance)) < '40') {
            result = '50'
        } else if(Number(fromWei(_balance)) >= '40' && Number(fromWei(_balance)) < '99') {
            result = '60'
        } else if(Number(fromWei(_balance)) >= '100') {
            result = '100'
        }
        return result.toString();
    } catch (error) { console.log(error.message) }
}

const getFirstTransaction = async () => {
    const result = (await getERC20TokenTransactions()).result;
    if(result[0]) return result[0].blockNumber;
}

const getERC20TokenTransactions = async () => {
    const result = (
        await fetch(`https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${EthanolAddress}&address=${user}&apikey=${apiKey}`)
    ).json()
    return result;
}


const getAllGasFee = async () => await fetchTransactionList(ethanolStartBlocktime);

const filterSearch = async () => {
    const data = (await getAllGasFee()).result;
    let gasUsed = 0;
    let gasPrice = 0;

    for(let i = 0; i < data.length; i++) {
        if(data[i].to === user) continue;
        gasUsed = gasUsed + Number(data[i].gasUsed);
        gasPrice = gasPrice + Number(data[i].gasPrice);
    }

    const gasFee = fromWei((gasUsed*gasPrice) *  600);

    // console.log(`gasPrice: ${gasPrice}`)
    // console.log('gasUsed', gasUsed)

    // console.log(`gasFee: ${gasFee}`)

    return gasFee;
}
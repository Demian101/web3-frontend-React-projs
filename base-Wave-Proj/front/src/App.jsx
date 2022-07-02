import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import abi from './utils/WavePortal.json';

export default function App() {
  const [inputMessage, setInputMessage] = useState('');

  // useState 赋 null 的初始值给 currentAccount，使用 setCurrentAccount 对 currentAccount 的 value 进行更改
  // 当我们连接到 MetaMask 前，useState为空  ;  当我们连接到 MetaMask 后，useState为首个账号地址
  const [currentAccount, setCurrentAccount] = useState(null);
  const [totalWaves, setTotalWaves] = useState(null);
  const [allWaves, setAllWaves] = useState([]);
  const [isMining, setIsMining] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const contractAddress = '0xF0e8C3c63Af52F884BD6C0439aE64842697761D9';
  const contractABI = abi.abi;

  const onNewWave = (from, timestamp, message) => {
    console.log('NewWave', from, timestamp, message);

    // 将 allWaves展开之前的数据（Waves,即别人和我们打招呼的 Messages）
    // 再把最新的 struct 对象 追加上去。
    setAllWaves( [
      ...allWaves,
      {
        address: from.toString(),
        timestamp: new Date(timestamp * 1000).toString(),
        message: message
      }
    ]);
  };

  // 比较 2 次打招呼之前的时间间隔，间隔不能大短。
  const compareTimestamps = (waveA, waveB) => {
    if (waveA.timestamp > waveB.timestamp) {  return -1; }
    if (waveA.timestamp < waveB.timestamp) {  return 1;  }
    return 0;
  };

  const connectWallet = async () => {
    const { ethereum } = window;  // 解包对象, window 有上千个对象，我们只要 MetaMask 注入的这个ethereum 就可以了。
    const accounts = await ethereum.request({
      // ethereum 的 eth_requestAccounts 方法是建立初始连接 MetaMask 的函数。
      method: 'eth_requestAccounts'   
    });

    const account = accounts[0];
    console.log('Connected', account);
    setCurrentAccount(account);
    setIsLoggedIn(true);
    getAllWaves();
  };

  // 输入框中需要写东西才能提交，否则就会在浏览器弹出 Alert。
  const wave = async () => {
    if (inputMessage.trim() === '') {
      alert( "Leave a comment in the text box above the 'Wave at Me' button and then hit the button!"  );
      return;
    }

    try {
      const { ethereum } = window;  // 解包对象,

      if (!ethereum) { 
        alert('Install Metamask!'); 
        return;   }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(  // 连接钱包的一些配置，还记得 ABI 吗 ？
        contractAddress,
        contractABI,
        signer
      );

      const waveTxn = await wavePortalContract.wave(inputMessage, {  // 设置消耗的最大 gas
        gasLimit: 1000000
      });
      console.log('Mining: ', waveTxn.hash);   // 当有人提交了 Message 后，合约就会尝试修改变量，将其写到区块链上，这需要时间。
      setIsMining(true);

      await waveTxn.wait();
      console.log('Mined!', waveTxn.hash);  // 在区块链上改动完毕后，返回 Transaction 的 hash 值。
      setIsMining(false);

      const waves = await wavePortalContract.getAllWaves();
      setTotalWaves(waves.length);   // 设置目前和我们打招呼的招呼总数。

      const processedWaves = waves.map(wave => {
        return {
          address: wave.waver.toString(),
          timestamp: new Date(wave.timestamp * 1000).toString(),
          message: wave.message
        };
      });
      setAllWaves(processedWaves);
    } catch (error) {
        console.log(error);
        alert("If you've already waved today, come back tomorrow!");
        setIsMining(false);
    }
  };

  // 检查钱包是否链接
  const checkWalletConnection = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Install MetaMask!');
        alert('MetaMask needed to use this site!');
      } else {
        console.log('Ethereum object found!', ethereum);
      }
      // ethereum 的 eth_accounts 方法查看是否有权访问用户钱包中的帐户。
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];  // 有可能拿到连接到 MetaMask 的多个账户，这里只取第一个。
        console.log('Found authorized account!', account);
        setCurrentAccount(account);
        setIsLoggedIn(true);
      } else {
        console.log('No authorized account found!');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {  alert('Install Metamask!');  return;  }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(   // 连接钱包的一些配置，还记得 ABI 吗 ？
        contractAddress,
        contractABI,
        signer
      );

      const waves = await wavePortalContract.getAllWaves();
      const processedWaves = waves.map(wave => {
        return {
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message
        };
      });
      setAllWaves(processedWaves);
    } catch (error) {
      console.error(error);
    }
  };

  // 副作用 hook， [] 是第二个参数，因为 [] 是空数组，不会变，所以函数体操作只执行一次。
  useEffect(() => {
    let wavePortalContract;

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      // ethers.contract.on 是 ethers.js 中用来监听事件Event 的。
      // https://learnblockchain.cn/docs/ethers.js/api-contract.html#id6
      //  在合约里面事件是这么写的（如下），所以说 'NewWave' 就是指合约里的事件
      //    event NewWave(address indexed from, uint256 timestamp, string message);
      // 从执行过程也可以看出，onNewWave 这个函数是在 Mining 后， Mined 完成的同时(或之后)启动、log 的。

      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        // Unsubscribe listener to event.  取消订阅事件 Events 
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, []);

  // React hook, 副作用 hook， [] 是第二个参数，如果 [] 内的值发生变化，则执行 2 个函数
  // 因为 [] 是空数组，不会变，所以这个函数只执行一次。
  useEffect(() => {
    checkWalletConnection();
    getAllWaves();
  }, []);

  return (
    <div className="mainContainer">
	  {!isLoggedIn && (
        <button className="loginButton" onClick={connectWallet}>
          Login to MetaMask
        </button>
      )}
      {isLoggedIn && (
        <div className="dataContainer">
		  {/* 给图片加跳转链接 */}
          <a
            href="https://github.com/Sodaoo"
            // eslint-disable-next-line react/jsx-no-target-blank
            target="_blank"  >
            <img className="logo" src="https://avatars.githubusercontent.com/u/33189338?v=4"  alt="numoonchld" />
          </a>

          <div className="bio">
            <a href="https://github.com/Sodaoo"
            > Demian </a>
            
			{/* 网易云音乐的 iframe */}
            <iframe   
			  style={{ borderRadius: '12px', margin: '10px 0px 0px 0px' }} 
			  src="//music.163.com/outchain/player?type=0&id=7133315069&auto=1&height=430"
			  frameBorder="0" title="iframe2" width="100%" height="240" 
              />
            <br />

            {!isMining && (
              <div className="waveTile">
                <textarea
                  className="waveMessage"
                  placeholder="跟我打个招呼吧 ! ~ "
                  value={inputMessage}
                  onChange={event => setInputMessage(event.target.value)}
                  rows="5"
                  required
                />
                <button className="waveButton" onClick={wave}>
                  <div> Wave at Me </div>
                  <small className="totalWaves">{allWaves.length}</small>
                </button>
                <small>(ETH wallet signature required)</small>
              </div>
            )}
            {isMining && (
              <>
                <div className="miningSpinner" />
              </>
            )}
          </div>

          <div className="waveTable">
            <b style={{ marginBottom: '0%' }}>Wave Log</b>
            {allWaves.sort(compareTimestamps).map(wave => (
              <div key={Date.parse(wave.timestamp)} className="waveTableEntry">
                <small>{wave.address}</small>
                <small>{wave.timestamp.toString()}</small>
                <hr style={{ width: '100%' }} />
                {wave.message ? wave.message : '<blank message>'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
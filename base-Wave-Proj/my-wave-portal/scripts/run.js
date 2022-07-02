// const main = async () => {
//   const waveContractFactory = await hre.ethers.getContractFactory('WavePortal');
//   const waveContract = await waveContractFactory.deploy({
//     value: hre.ethers.utils.parseEther('0.1'),
//   });
//   await waveContract.deployed();
//   console.log('Contract addy:', waveContract.address);

//   let contractBalance = await hre.ethers.provider.getBalance(
//     waveContract.address
//   );
//   console.log(
//     'Contract balance:',
//     hre.ethers.utils.formatEther(contractBalance)
//   );

//   const waveTxn = await waveContract.wave('This is wave #1');
//   await waveTxn.wait();

//   const waveTxn2 = await waveContract.wave('This is wave #2');
//   await waveTxn2.wait();

//   contractBalance = await hre.ethers.provider.getBalance(waveContract.addresss);
//   console.log(
//     'Contract balance:',
//     hre.ethers.utils.formatEther(contractBalance)
//   );

//   let allWaves = await waveContract.getAllWaves();
//   console.log(allWaves);
// };

// const runMain = async () => {
//   try {
//     await main();
//     process.exit(0);
//   } catch (error) {
//     console.log(error);
//     process.exit(1);
//   }
// };

// runMain();

const main = async () => {

  const [owner, randomPerson] = await hre.ethers.getSigners()

  const waveContractFactory = await hre.ethers.getContractFactory("WavePortal")
  const waveContract = await waveContractFactory.deploy({
    value: hre.ethers.utils.parseEther("0.1"),
  })
  await waveContract.deployed()

  console.log("Contract deployed to: ", waveContract.address)
  console.log("Contract deployed by: ", owner.address)

  let contractBalance = await hre.ethers.provider.getBalance(waveContract.address)
  console.log("Contract Balance:", hre.ethers.utils.formatEther(contractBalance))


  await waveContract.getWaveCount(owner.address)
  await waveContract.getWaveCount(randomPerson.address)

  let waveCount
  waveCount = await waveContract.getTotalWaves()

  let waveTxn = await waveContract.wave('message 1')
  await waveTxn.wait()

  waveCount = await waveContract.getTotalWaves()

  waveTxn = await waveContract.connect(randomPerson).wave('message 2')
  await waveTxn.wait()

  waveCount = await waveContract.getTotalWaves()

  waveTxn = await waveContract.wave('message 3')
  await waveTxn.wait()

  await waveContract.getTotalWaves()
  await waveContract.getWaveCount(owner.address)
  await waveContract.getWaveCount(randomPerson.address)

  contractBalance = await hre.ethers.provider.getBalance(waveContract.address)
  console.log("Contract Balance:", hre.ethers.utils.formatEther(contractBalance))

  let allWaves = await waveContract.getAllWaves()
  console.log(allWaves)
}

const runMain = async () => {
  try {
    await main()
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

runMain()
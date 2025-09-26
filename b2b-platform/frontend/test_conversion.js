const exchangeRates = {
  KZT: 1,
  USD: 450,
  RUB: 5.0
};

const convertPrice = (price, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return price;
  const fromRate = exchangeRates[fromCurrency];
  const toRate = exchangeRates[toCurrency];
  if (!fromRate || !toRate) return price;
  const priceInKZT = price * fromRate;
  const priceInTargetCurrency = priceInKZT / toRate;
  return priceInTargetCurrency;
};

console.log('100 USD в KZT:', convertPrice(100, 'USD', 'KZT'));
console.log('45000 KZT в USD:', convertPrice(45000, 'KZT', 'USD'));
console.log('1000 RUB в KZT:', convertPrice(1000, 'RUB', 'KZT'));
console.log('5000 KZT в RUB:', convertPrice(5000, 'KZT', 'RUB'));
console.log('100 USD в RUB:', convertPrice(100, 'USD', 'RUB'));

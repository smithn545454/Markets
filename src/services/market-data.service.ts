import axios from 'axios';
import { MarketData, MarketDataProvider } from '../types/market-data.types';
import { API_CONFIG } from '../config/api.config';

export class AlphaVantageService implements MarketDataProvider {
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor() {
        this.baseUrl = API_CONFIG.ALPHA_VANTAGE.BASE_URL;
        this.apiKey = API_CONFIG.ALPHA_VANTAGE.API_KEY || '';
    }

    async fetchStockData(symbol: string): Promise<MarketData[]> {
        try {
            const response = await axios.get(
                `${this.baseUrl}?function=${API_CONFIG.ALPHA_VANTAGE.ENDPOINTS.DAILY}&symbol=${symbol}&apikey=${this.apiKey}`
            );

            // Transform Alpha Vantage data to our MarketData format
            const timeSeries = response.data['Time Series (Daily)'];
            return Object.entries(timeSeries).map(([date, data]: [string, any]) => ({
                symbol,
                timestamp: new Date(date),
                price: parseFloat(data['4. close']),
                volume: parseInt(data['5. volume']),
                change: parseFloat(data['4. close']) - parseFloat(data['1. open']),
                changePercent: ((parseFloat(data['4. close']) - parseFloat(data['1. open'])) / parseFloat(data['1. open'])) * 100
            }));
        } catch (error) {
            console.error('Error fetching stock data:', error);
            throw error;
        }
    }

    async getRealtimeData(symbol: string): Promise<MarketData> {
        try {
            const response = await axios.get(
                `${this.baseUrl}?function=${API_CONFIG.ALPHA_VANTAGE.ENDPOINTS.INTRADAY}&symbol=${symbol}&interval=1min&apikey=${this.apiKey}`
            );

            // Get the latest data point
            const timeSeries = response.data['Time Series (1min)'];
            const latestTimestamp = Object.keys(timeSeries)[0];
            const latestData = timeSeries[latestTimestamp];

            return {
                symbol,
                timestamp: new Date(latestTimestamp),
                price: parseFloat(latestData['4. close']),
                volume: parseInt(latestData['5. volume']),
                change: parseFloat(latestData['4. close']) - parseFloat(latestData['1. open']),
                changePercent: ((parseFloat(latestData['4. close']) - parseFloat(latestData['1. open'])) / parseFloat(latestData['1. open'])) * 100
            };
        } catch (error) {
            console.error('Error fetching realtime data:', error);
            throw error;
        }
    }
}
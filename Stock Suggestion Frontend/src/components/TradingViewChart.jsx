import React, { useEffect, useRef } from 'react';
// 1. This is the correct import for v4 (the latest)
import { createChart, ColorType } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';

const TradingViewChart = ({ data }) => {
  const chartContainerRef = useRef(null);
  
  // Refs for the chart and series. We use refs to hold the chart
  // instance so it survives re-renders.
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const { theme } = useTheme();

  // --- HOOK 1: CREATE AND CLEAN UP THE CHART ---
  // This hook runs ONLY ONCE when the component mounts.
  // The empty dependency array `[]` is the key.
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });
    
    chart.timeScale().fitContent();
    chartRef.current = chart;

    // --- Create Series ---
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#34D399',
      downColor: '#EF4444',
      borderDownColor: '#EF4444',
      borderUpColor: '#34D399',
      wickDownColor: '#EF4444',
      wickUpColor: '#34D399',
    });
    candlestickSeriesRef.current = candlestickSeries;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume_scale',
    });
    volumeSeriesRef.current = volumeSeries;

    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: {
        top: 0.75, // 75% for main chart, 25% for volume
        bottom: 0,
      },
    });

    // --- Resize Observer ---
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.resize(entry.contentRect.width, 400);
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    // --- Cleanup ---
    // This function runs when the component unmounts
    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []); // <-- Empty array means this runs ONCE. This fixes the StrictMode bug.

  // --- HOOK 2: UPDATE THE THEME ---
  // This hook runs *only* when the theme changes.
  useEffect(() => {
    if (!chartRef.current) return; // Don't run if chart isn't created yet

    const isDarkMode = theme === 'dark';
    chartRef.current.applyOptions({
      layout: { 
        background: { 
          type: ColorType.Solid, 
          color: isDarkMode ? '#1f2937' : '#FFFFFF'
        },
        textColor: isDarkMode ? '#D1D5DB' : '#1F2937',
      },
      grid: {
        vertLines: { color: isDarkMode ? '#374151' : '#E5E7EB' },
        horzLines: { color: isDarkMode ? '#374151' : '#E5E7EB' },
      },
      timeScale: {
        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
      },
      rightPriceScale: {
        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
      },
    });
  }, [theme]); // <-- Runs only when theme changes

  // --- HOOK 3: UPDATE THE DATA ---
  // This hook runs *only* when the data prop changes.
  useEffect(() => {
    // Don't run if the series aren't created yet
    if (data.length === 0 || !candlestickSeriesRef.current || !volumeSeriesRef.current) {
      return;
    }

    // 1. Transform data
    const chartData = data.map(item => ({
      time: item.date,
      open: item.Open,
      high: item.High,
      low: item.Low,
      close: item.Close,
    }));
  
    const volumeData = data.map(item => ({
      time: item.date,
      value: item.Volume,
      color: item.Close > item.Open ? 'rgba(52, 211, 153, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }));

    // 2. Set the data on the chart
    candlestickSeriesRef.current.setData(chartData);
    volumeSeriesRef.current.setData(volumeData);

    chartRef.current.timeScale().fitContent();

  }, [data]); // <-- Runs only when data changes

  // The container element for the chart
  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
};

export default TradingViewChart;
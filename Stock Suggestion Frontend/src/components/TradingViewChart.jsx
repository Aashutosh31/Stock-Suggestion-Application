import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';

const TradingViewChart = ({ data }) => {
  const chartContainerRef = useRef(null);
  const { theme } = useTheme();

  // This single, simpler useEffect will run when data or theme changes.
  // It is NOT StrictMode-proof, which is why Step 1 is required.
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) {
      return;
    }

    // --- 1. Apply Theme ---
    const isDarkMode = theme === 'dark';
    const chartOptions = {
      width: chartContainerRef.current.clientWidth,
      height: 400,
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
    };

    // --- 2. Create Chart ---
    // Clear the container *before* creating a new chart
    chartContainerRef.current.innerHTML = '';
    const chart = createChart(chartContainerRef.current, chartOptions);
    
    // --- 3. DEBUGGING & GUARD CLAUSE ---
    // This will tell us if createChart() is the problem.
    console.log('New chart object:', chart); 
    if (!chart || typeof chart.addCandlestickSeries !== 'function') {
        console.error('CRITICAL: createChart() did not return a valid chart object.');
        return; // Stop execution if the chart object is invalid
    }

    // --- 4. Add Series ---
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#34D399',
      downColor: '#EF4444',
      borderDownColor: '#EF4444',
      borderUpColor: '#34D399',
      wickDownColor: '#EF4444',
      wickUpColor: '#34D399',
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale',
    });

    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });

    // --- 5. Set Data ---
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
    
    candlestickSeries.setData(chartData);
    volumeSeries.setData(volumeData);
    chart.timeScale().fitContent();

    // --- 6. Resize Observer ---
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.resize(entry.contentRect.width, 400);
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    // --- 7. Cleanup ---
    return () => {
      resizeObserver.disconnect();
      if (chart) {
        chart.remove();
      }
    };
  
  // This hook now re-runs if data or theme changes.
  }, [data, theme]); 

  // The container element for the chart
  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
};

export default TradingViewChart;
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, ScatterChart, Scatter,
  ZAxis, Treemap
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import { Badge } from "./ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { AlertCircle, AlertTriangle, CheckCircle, Activity, DollarSign, Package, TrendingUp, Calendar } from "lucide-react";

// Custom color schemes for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];
const COLOR_SCALE = ['#d3f2c2', '#91e3a9', '#52d199', '#28b487', '#17967c', '#0a7969', '#035c53', '#004039'];

// Helper to format currency values
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper to get date ranges from timestamp strings
const getDateRange = (data, dateField) => {
  const dates = data
    .map(item => item[dateField])
    .filter(Boolean)
    .map(date => new Date(date));
  
  if (dates.length === 0) return null;
  
  return {
    min: new Date(Math.min(...dates)),
    max: new Date(Math.max(...dates)),
    range: Math.ceil((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24))
  };
};

// Data Quality Heatmap Component
const DataQualityHeatmap = ({ data, schema }) => {
  // Skip if no data or schema
  if (!data || data.length === 0 || !schema) return null;
  
  // Calculate completeness for each field
  const fields = Object.keys(schema);
  const fieldStats = fields.map(field => {
    const values = data.map(item => item[field]);
    const nonEmptyCount = values.filter(val => val !== null && val !== undefined && val !== "").length;
    const completeness = (nonEmptyCount / data.length) * 100;
    
    return {
      field,
      completeness,
      required: schema[field]?.required || false
    };
  });
  
  // Get overall data quality score
  const requiredFields = fieldStats.filter(f => f.required);
  const requiredCompleteness = requiredFields.length > 0 
    ? requiredFields.reduce((sum, field) => sum + field.completeness, 0) / requiredFields.length
    : 100;
  
  const overallCompleteness = fieldStats.reduce((sum, field) => sum + field.completeness, 0) / fieldStats.length;
  
  // Determine quality status
  let qualityStatus;
  if (requiredCompleteness === 100 && overallCompleteness > 90) {
    qualityStatus = { icon: <CheckCircle className="text-green-500" />, label: "Excellent", color: "bg-green-100 text-green-800" };
  } else if (requiredCompleteness === 100 && overallCompleteness > 75) {
    qualityStatus = { icon: <CheckCircle className="text-green-400" />, label: "Good", color: "bg-green-50 text-green-700" };
  } else if (requiredCompleteness > 95) {
    qualityStatus = { icon: <AlertTriangle className="text-amber-500" />, label: "Fair", color: "bg-amber-50 text-amber-700" };
  } else {
    qualityStatus = { icon: <AlertCircle className="text-red-500" />, label: "Needs Attention", color: "bg-red-50 text-red-700" };
  }
  
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Data Quality Assessment</h3>
        <Badge className={qualityStatus.color}>
          <span className="flex items-center">
            {qualityStatus.icon}
            <span className="ml-1">{qualityStatus.label}</span>
          </span>
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Required Fields Completeness</div>
          <div className="text-3xl font-bold mt-1">{requiredCompleteness.toFixed(1)}%</div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
            <div 
              className={`h-2.5 rounded-full ${
                requiredCompleteness > 95 ? 'bg-green-500' : 
                requiredCompleteness > 85 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${requiredCompleteness}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Overall Completeness</div>
          <div className="text-3xl font-bold mt-1">{overallCompleteness.toFixed(1)}%</div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
            <div 
              className={`h-2.5 rounded-full ${
                overallCompleteness > 90 ? 'bg-green-500' : 
                overallCompleteness > 75 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${overallCompleteness}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completeness</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fieldStats.map((fieldStat, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{fieldStat.field}</td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {fieldStat.required ? 
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Required</Badge> : 
                    <span className="text-gray-400">Optional</span>
                  }
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="mr-2">{fieldStat.completeness.toFixed(1)}%</span>
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          fieldStat.completeness === 100 ? 'bg-green-500' : 
                          fieldStat.completeness > 90 ? 'bg-green-400' : 
                          fieldStat.completeness > 75 ? 'bg-amber-400' : 
                          'bg-red-400'
                        }`}
                        style={{ width: `${fieldStat.completeness}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {fieldStat.completeness === 100 ? (
                    <span className="inline-flex items-center text-green-700">
                      <CheckCircle className="h-4 w-4 mr-1" /> Complete
                    </span>
                  ) : fieldStat.completeness > 90 ? (
                    <span className="inline-flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" /> Good
                    </span>
                  ) : fieldStat.completeness > 75 ? (
                    <span className="inline-flex items-center text-amber-600">
                      <AlertTriangle className="h-4 w-4 mr-1" /> Fair
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" /> Low
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Inventory Visualization Component
const InventoryVisualization = ({ data, businessType }) => {
  const [viewMode, setViewMode] = useState('quantity');
  
  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-500">No inventory data available for visualization</div>;
  }
  
  // Prepare data for charts
  const prepareInventoryData = () => {
    // Group by SKU and sum quantities
    const skuGroups = {};
    data.forEach(item => {
      const sku = item.sku || 'Unspecified';
      if (!skuGroups[sku]) {
        skuGroups[sku] = {
          sku,
          quantity: 0,
          location: item.location || 'Unspecified'
        };
      }
      skuGroups[sku].quantity += parseFloat(item.quantity) || 0;
    });
    
    // Convert to array and sort by quantity
    return Object.values(skuGroups)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);  // Top 10 SKUs
  };
  
  // Prepare location data if available
  const prepareLocationData = () => {
    if (!data.some(item => item.location)) {
      return null;
    }
    
    // Group by location and sum quantities
    const locationGroups = {};
    data.forEach(item => {
      const location = item.location || 'Unspecified';
      if (!locationGroups[location]) {
        locationGroups[location] = {
          location,
          quantity: 0,
          skuCount: 0
        };
      }
      locationGroups[location].quantity += parseFloat(item.quantity) || 0;
      locationGroups[location].skuCount += 1;
    });
    
    // Convert to array
    return Object.values(locationGroups);
  };
  
  const inventoryData = prepareInventoryData();
  const locationData = prepareLocationData();
  
  // Business-specific insights
  const getBusinessInsights = () => {
    const totalQuantity = data.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const uniqueSkus = new Set(data.map(item => item.sku).filter(Boolean)).size;
    
    let insights = [
      { icon: <Package className="h-5 w-5" />, label: "Total Inventory", value: totalQuantity.toLocaleString() },
      { icon: <Activity className="h-5 w-5" />, label: "Unique SKUs", value: uniqueSkus.toLocaleString() }
    ];
    
    // Add business-specific insights
    if (businessType === 'retail') {
      // Calculate potential low stock items (less than 5% of average)
      const avgQuantity = totalQuantity / uniqueSkus;
      const lowStockThreshold = avgQuantity * 0.05;
      const lowStockCount = inventoryData.filter(item => item.quantity < lowStockThreshold).length;
      
      insights.push({ 
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, 
        label: "Low Stock Items", 
        value: lowStockCount,
        highlight: lowStockCount > 0
      });
    } 
    else if (businessType === 'distribution') {
      // Calculate location efficiency (% of locations with >90% of SKUs)
      if (locationData) {
        const locationCount = locationData.length;
        const highCoverageLocations = locationData.filter(loc => 
          loc.skuCount > uniqueSkus * 0.9
        ).length;
        
        insights.push({ 
          icon: <TrendingUp className="h-5 w-5" />, 
          label: "Warehouse Utilization", 
          value: locationCount > 0 ? `${((highCoverageLocations / locationCount) * 100).toFixed(1)}%` : 'N/A'
        });
      }
    }
    else if (businessType === 'food_cpg') {
      // For food/CPG, time-based insights are valuable
      insights.push({ 
        icon: <Calendar className="h-5 w-5" />, 
        label: "Avg Units Per SKU", 
        value: (totalQuantity / uniqueSkus).toFixed(1)
      });
    }
    
    return insights;
  };
  
  return (
    <div className="space-y-6">
      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {getBusinessInsights().map((insight, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border flex items-center">
            <div className={`p-3 rounded-full ${insight.highlight ? 'bg-amber-100' : 'bg-blue-100'} mr-4`}>
              {insight.icon}
            </div>
            <div>
              <div className="text-sm text-gray-500">{insight.label}</div>
              <div className={`text-2xl font-bold ${insight.highlight ? 'text-amber-600' : ''}`}>
                {insight.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart Tabs */}
      <Tabs defaultValue="topItems" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="topItems">Top Inventory Items</TabsTrigger>
          {locationData && <TabsTrigger value="byLocation">Inventory by Location</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="topItems" className="p-0">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Top 10 Inventory Items</h3>
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="View Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">By Quantity</SelectItem>
                  <SelectItem value="treemap">Treemap View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'quantity' ? (
                  <BarChart
                    data={inventoryData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sku" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="quantity" fill="#0088FE" name="Quantity" />
                  </BarChart>
                ) : (
                  <Treemap
                    data={inventoryData}
                    dataKey="quantity"
                    nameKey="sku"
                    fill="#0088FE"
                    content={({ root, depth, x, y, width, height, index, name, value }) => (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          style={{
                            fill: COLORS[index % COLORS.length],
                            stroke: '#fff',
                            strokeWidth: 2
                          }}
                        />
                        {width > 70 && height > 30 && (
                          <>
                            <text
                              x={x + width / 2}
                              y={y + height / 2 - 10}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize={14}
                              fontWeight="bold"
                            >
                              {name}
                            </text>
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 10}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize={12}
                            >
                              {value.toLocaleString()}
                            </text>
                          </>
                        )}
                      </g>
                    )}
                  />
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
        
        {locationData && (
          <TabsContent value="byLocation" className="p-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium mb-4">Inventory by Location</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={locationData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="quantity" fill="#00C49F" name="Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Sales History Visualization Component
const SalesHistoryVisualization = ({ data, businessType }) => {
  const [viewMode, setViewMode] = useState('trend');
  
  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-500">No sales data available for visualization</div>;
  }
  
  // Extract time periods if available
  const hasTimePeriod = data.some(item => item['time period']);
  const dateRange = hasTimePeriod ? getDateRange(data, 'time period') : null;
  
  // Prepare trend data
  const prepareTrendData = () => {
    if (!hasTimePeriod) return null;
    
    // Group by time period
    const trendData = {};
    data.forEach(item => {
      if (!item['time period']) return;
      
      const date = new Date(item['time period']);
      const periodKey = date.toISOString().split('T')[0];
      
      if (!trendData[periodKey]) {
        trendData[periodKey] = {
          date: periodKey,
          quantity: 0,
          revenue: 0
        };
      }
      
      trendData[periodKey].quantity += parseFloat(item.quantity) || 0;
      trendData[periodKey].revenue += parseFloat(item.revenue) || 0;
    });
    
    // Convert to array and sort by date
    return Object.values(trendData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  
  // Prepare SKU data
  const prepareSkuData = () => {
    // Group by SKU
    const skuData = {};
    data.forEach(item => {
      const sku = item.sku || 'Unspecified';
      
      if (!skuData[sku]) {
        skuData[sku] = {
          sku,
          quantity: 0,
          revenue: 0,
          channel: item.channel
        };
      }
      
      skuData[sku].quantity += parseFloat(item.quantity) || 0;
      skuData[sku].revenue += parseFloat(item.revenue) || 0;
    });
    
    // Convert to array and sort by quantity or revenue
    return Object.values(skuData)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);  // Top 10 SKUs
  };
  
  // Prepare channel data if available
  const prepareChannelData = () => {
    if (!data.some(item => item.channel)) {
      return null;
    }
    
    // Group by channel
    const channelData = {};
    data.forEach(item => {
      const channel = item.channel || 'Unspecified';
      
      if (!channelData[channel]) {
        channelData[channel] = {
          channel,
          quantity: 0,
          revenue: 0
        };
      }
      
      channelData[channel].quantity += parseFloat(item.quantity) || 0;
      channelData[channel].revenue += parseFloat(item.revenue) || 0;
    });
    
    // Convert to array
    return Object.values(channelData);
  };
  
  const trendData = prepareTrendData();
  const skuData = prepareSkuData();
  const channelData = prepareChannelData();
  
  // Business-specific insights
  const getBusinessInsights = () => {
    const totalQuantity = data.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalRevenue = data.reduce((sum, item) => sum + (parseFloat(item.revenue) || 0), 0);
    const uniqueSkus = new Set(data.map(item => item.sku).filter(Boolean)).size;
    
    let insights = [
      { icon: <Package className="h-5 w-5" />, label: "Total Units Sold", value: totalQuantity.toLocaleString() },
      { icon: <DollarSign className="h-5 w-5" />, label: "Total Revenue", value: formatCurrency(totalRevenue) }
    ];
    
    // Add business-specific insights
    if (businessType === 'retail') {
      // Calculate average revenue per unit
      const avgRevenue = totalRevenue / totalQuantity;
      
      insights.push({ 
        icon: <TrendingUp className="h-5 w-5" />, 
        label: "Avg Revenue Per Unit", 
        value: formatCurrency(avgRevenue)
      });
    } 
    else if (businessType === 'distribution') {
      // Calculate days in date range if available
      if (dateRange) {
        insights.push({ 
          icon: <Calendar className="h-5 w-5" />, 
          label: "Daily Sales Rate", 
          value: dateRange.range > 0 ? Math.round(totalQuantity / dateRange.range).toLocaleString() : 'N/A'
        });
      }
    }
    else if (businessType === 'food_cpg') {
      // For food/CPG, calculate product performance
      insights.push({ 
        icon: <TrendingUp className="h-5 w-5" />, 
        label: "Avg Sales Per SKU", 
        value: uniqueSkus > 0 ? Math.round(totalQuantity / uniqueSkus).toLocaleString() : 'N/A'
      });
    }
    
    return insights;
  };
  
  return (
    <div className="space-y-6">
      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {getBusinessInsights().map((insight, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              {insight.icon}
            </div>
            <div>
              <div className="text-sm text-gray-500">{insight.label}</div>
              <div className="text-2xl font-bold">
                {insight.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart Tabs */}
      <Tabs defaultValue={hasTimePeriod ? "trend" : "topItems"} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          {hasTimePeriod && <TabsTrigger value="trend">Sales Trend</TabsTrigger>}
          <TabsTrigger value="topItems">Top Selling Items</TabsTrigger>
          {channelData && <TabsTrigger value="byChannel">Sales by Channel</TabsTrigger>}
        </TabsList>
        
        {hasTimePeriod && (
          <TabsContent value="trend" className="p-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">Sales Trend</h3>
                <Select value={viewMode} onValueChange={setViewMode}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="View Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trend">Quantity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={viewMode === 'trend' ? "quantity" : "revenue"} 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }}
                      name={viewMode === 'trend' ? "Units Sold" : "Revenue"} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        )}
        
        <TabsContent value="topItems" className="p-0">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium mb-4">Top Selling Items</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skuData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sku" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Legend />
                  <Bar dataKey="quantity" fill="#8884d8" name="Units Sold" />
                  {skuData.some(item => item.revenue) && (
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
        
        {channelData && (
          <TabsContent value="byChannel" className="p-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium mb-4">Sales by Channel</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      dataKey="quantity"
                      nameKey="channel"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={(entry) => entry.channel}
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Purchase Orders Visualization Component
const PurchaseOrdersVisualization = ({ data, businessType }) => {
  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-500">No purchase order data available for visualization</div>;
  }
  
  // Check which fields we have
  const hasArrivalDate = data.some(item => item['arrival date']);
  const hasVendor = data.some(item => item.vendor);
  const hasCost = data.some(item => item.cost);
  
  // Prepare timeline data
  const prepareTimelineData = () => {
    if (!hasArrivalDate) return null;
    
    // Group by arrival date
    const timelineData = {};
    data.forEach(item => {
      if (!item['arrival date']) return;
      
      const date = new Date(item['arrival date']);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!timelineData[dateKey]) {
        timelineData[dateKey] = {
          date: dateKey,
          quantity: 0,
          cost: 0,
          orderCount: 0
        };
      }
      
      timelineData[dateKey].quantity += parseFloat(item.quantity) || 0;
      timelineData[dateKey].cost += parseFloat(item.cost) || 0;
      timelineData[dateKey].orderCount += 1;
    });
    
    // Convert to array and sort by date
    return Object.values(timelineData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  
  // Prepare vendor data
  const prepareVendorData = () => {
    if (!hasVendor) return null;
    
    // Group by vendor
    const vendorData = {};
    data.forEach(item => {
      const vendor = item.vendor || 'Unspecified';
      
      if (!vendorData[vendor]) {
        vendorData[vendor] = {
          vendor,
          quantity: 0,
          cost: 0,
          orderCount: 0
        };
      }
      
      vendorData[vendor].quantity += parseFloat(item.quantity) || 0;
      vendorData[vendor].cost += parseFloat(item.cost) || 0;
      vendorData[vendor].orderCount += 1;
    });
    
    // Convert to array and sort by quantity
    return Object.values(vendorData)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);  // Top 10 vendors
  };
  
  // Prepare cost distribution data
  const prepareCostData = () => {
    if (!hasCost) return null;
    
    // Group orders by cost range
    const costRanges = [
      { name: '$0-$100', min: 0, max: 100 },
      { name: '$100-$500', min: 100, max: 500 },
      { name: '$500-$1K', min: 500, max: 1000 },
      { name: '$1K-$5K', min: 1000, max: 5000 },
      { name: '$5K-$10K', min: 5000, max: 10000 },
      { name: '$10K+', min: 10000, max: Infinity }
    ];
    
    const costData = costRanges.map(range => ({
      ...range,
      count: 0,
      totalCost: 0
    }));
    
    data.forEach(item => {
      const cost = parseFloat(item.cost) || 0;
      
      for (const range of costData) {
        if (cost >= range.min && cost < range.max) {
          range.count += 1;
          range.totalCost += cost;
          break;
        }
      }
    });
    
    // Remove empty ranges
    return costData.filter(range => range.count > 0);
  };
  
  const timelineData = prepareTimelineData();
  const vendorData = prepareVendorData();
  const costData = prepareCostData();
  
  // Business-specific insights
  const getBusinessInsights = () => {
    const totalQuantity = data.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalCost = data.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
    const orderCount = data.length;
    
    let insights = [
      { icon: <Package className="h-5 w-5" />, label: "Total Units Ordered", value: totalQuantity.toLocaleString() },
      { icon: <DollarSign className="h-5 w-5" />, label: "Total Order Value", value: hasCost ? formatCurrency(totalCost) : 'N/A' }
    ];
    
    // Add business-specific insights
    if (businessType === 'retail') {
      // Calculate average cost per order
      const avgOrderValue = totalCost / orderCount;
      
      insights.push({ 
        icon: <TrendingUp className="h-5 w-5" />, 
        label: "Avg Order Value", 
        value: hasCost ? formatCurrency(avgOrderValue) : 'N/A'
      });
    } 
    else if (businessType === 'distribution') {
      // Calculate vendor metrics
      if (hasVendor) {
        const vendorCount = new Set(data.map(item => item.vendor).filter(Boolean)).size;
        
        insights.push({ 
          icon: <Activity className="h-5 w-5" />, 
          label: "Active Vendors", 
          value: vendorCount.toLocaleString()
        });
      }
    }
    else if (businessType === 'food_cpg') {
      // For food/CPG, calculate inventory turnover
      insights.push({ 
        icon: <Calendar className="h-5 w-5" />, 
        label: "Avg Units Per Order", 
        value: orderCount > 0 ? Math.round(totalQuantity / orderCount).toLocaleString() : 'N/A'
      });
    }
    
    return insights;
  };
  
  return (
    <div className="space-y-6">
      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {getBusinessInsights().map((insight, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              {insight.icon}
            </div>
            <div>
              <div className="text-sm text-gray-500">{insight.label}</div>
              <div className="text-2xl font-bold">
                {insight.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart Tabs */}
      <Tabs defaultValue={hasArrivalDate ? "timeline" : hasVendor ? "vendors" : "cost"} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          {hasArrivalDate && <TabsTrigger value="timeline">Order Timeline</TabsTrigger>}
          {hasVendor && <TabsTrigger value="vendors">Top Vendors</TabsTrigger>}
          {hasCost && <TabsTrigger value="cost">Cost Distribution</TabsTrigger>}
        </TabsList>
        
        {hasArrivalDate && (
          <TabsContent value="timeline" className="p-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium mb-4">Order Timeline</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timelineData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="quantity" 
                      stroke="#8884d8" 
                      name="Units Ordered" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orderCount" 
                      stroke="#82ca9d" 
                      name="Number of Orders" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        )}
        
        {hasVendor && (
          <TabsContent value="vendors" className="p-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium mb-4">Top Vendors</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vendorData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vendor" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="quantity" fill="#8884d8" name="Units Ordered" />
                    <Bar dataKey="orderCount" fill="#82ca9d" name="Number of Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        )}
        
        {hasCost && (
          <TabsContent value="cost" className="p-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium mb-4">Order Cost Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={costData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Number of Orders" />
                    <Bar dataKey="totalCost" fill="#82ca9d" name="Total Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Item Master Visualization Component
const ItemMasterVisualization = ({ data, businessType }) => {
  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-500">No item master data available for visualization</div>;
  }
  
  // Check which fields we have
  const hasCategory = data.some(item => item.category);
  const hasVendor = data.some(item => item.vendor);
  const hasPrice = data.some(item => item.price);
  const hasCost = data.some(item => item.cost);
  
  // Prepare category data
  const prepareCategoryData = () => {
    if (!hasCategory) return null;
    
    // Group by category
    const categoryData = {};
    data.forEach(item => {
      const category = item.category || 'Unspecified';
      
      if (!categoryData[category]) {
        categoryData[category] = {
          category,
          count: 0,
          avgPrice: 0,
          totalPrice: 0
        };
      }
      
      categoryData[category].count += 1;
      
      if (hasPrice && item.price) {
        const price = parseFloat(item.price) || 0;
        categoryData[category].totalPrice += price;
      }
    });
    
    // Calculate averages
    Object.values(categoryData).forEach(category => {
      category.avgPrice = category.count > 0 ? category.totalPrice / category.count : 0;
    });
    
    // Convert to array and sort by count
    return Object.values(categoryData)
      .sort((a, b) => b.count - a.count);
  };
  
  // Prepare price vs cost data
  const preparePriceVsCostData = () => {
    if (!hasPrice || !hasCost) return null;
    
    return data
      .filter(item => item.price && item.cost)
      .map(item => ({
        sku: item.sku,
        price: parseFloat(item.price) || 0,
        cost: parseFloat(item.cost) || 0,
        margin: parseFloat(item.price) - parseFloat(item.cost),
        marginPercent: (parseFloat(item.price) - parseFloat(item.cost)) / parseFloat(item.price) * 100
      }))
      .sort((a, b) => b.marginPercent - a.marginPercent);
  };
  
  // Prepare vendor data
  const prepareVendorData = () => {
    if (!hasVendor) return null;
    
    // Group by vendor
    const vendorData = {};
    data.forEach(item => {
      const vendor = item.vendor || 'Unspecified';
      
      if (!vendorData[vendor]) {
        vendorData[vendor] = {
          vendor,
          count: 0
        };
      }
      
      vendorData[vendor].count += 1;
    });
    
    // Convert to array and sort by count
    return Object.values(vendorData)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);  // Top 10 vendors
  };
  
  const categoryData = prepareCategoryData();
  const priceVsCostData = preparePriceVsCostData();
  const vendorData = prepareVendorData();
  
  // Business-specific insights
  const getBusinessInsights = () => {
    const totalItems = data.length;
    
    let insights = [
      { icon: <Package className="h-5 w-5" />, label: "Total SKUs", value: totalItems.toLocaleString() }
    ];
    
    // Calculate average margin if we have price and cost
    if (hasPrice && hasCost) {
      const validItems = data.filter(item => item.price && item.cost);
      const totalMargin = validItems.reduce((sum, item) => 
        sum + (parseFloat(item.price) - parseFloat(item.cost)), 0
      );
      const avgMargin = validItems.length > 0 ? totalMargin / validItems.length : 0;
      const avgMarginPercent = validItems.length > 0 ? 
        validItems.reduce((sum, item) => 
          sum + ((parseFloat(item.price) - parseFloat(item.cost)) / parseFloat(item.price) * 100), 0
        ) / validItems.length : 0;
      
      insights.push({ 
        icon: <DollarSign className="h-5 w-5" />, 
        label: "Avg Margin", 
        value: `${avgMarginPercent.toFixed(1)}%`
      });
    }
    
    // Add business-specific insights
    if (businessType === 'retail') {
      // Category diversity
      if (hasCategory) {
        const categoryCount = new Set(data.map(item => item.category).filter(Boolean)).size;
        
        insights.push({ 
          icon: <Activity className="h-5 w-5" />, 
          label: "Product Categories", 
          value: categoryCount.toLocaleString()
        });
      }
    } 
    else if (businessType === 'distribution') {
      // Vendor diversity
      if (hasVendor) {
        const vendorCount = new Set(data.map(item => item.vendor).filter(Boolean)).size;
        
        insights.push({ 
          icon: <Activity className="h-5 w-5" />, 
          label: "Vendors", 
          value: vendorCount.toLocaleString()
        });
      }
    }
    else if (businessType === 'food_cpg') {
      // For food/CPG, calculate average price
      if (hasPrice) {
        const avgPrice = data.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) / totalItems;
        
        insights.push({ 
          icon: <DollarSign className="h-5 w-5" />, 
          label: "Avg Price", 
          value: formatCurrency(avgPrice)
        });
      }
    }
    
    return insights;
  };
  
  return (
    <div className="space-y-6">
      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {getBusinessInsights().map((insight, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              {insight.icon}
            </div>
            <div>
              <div className="text-sm text-gray-500">{insight.label}</div>
              <div className="text-2xl font-bold">
                {insight.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart Tabs */}
      <Tabs defaultValue={hasCategory ? "categories" : hasPrice && hasCost ? "margins" : "vendors"} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          {hasCategory && <TabsTrigger value="categories">Product Categories</TabsTrigger>}
          {hasPrice && hasCost && <TabsTrigger value="margins">Price vs. Cost</TabsTrigger>}
          {hasVendor && <TabsTrigger value="vendors">Vendors</TabsTrigger>}
        </TabsList>
        
        {hasCategory && (
          <TabsContent value="categories" className="p-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium mb-4">Product Categories</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={(entry) => entry.category}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        )}
        
        {hasPrice && hasCost && (
          <TabsContent value="margins" className="p-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium mb-4">Price vs. Cost Analysis</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="cost" 
                      name="Cost" 
                      unit="$" 
                    />
                    <YAxis 
                      type="number" 
                      dataKey="price" 
                      name="Price" 
                      unit="$" 
                    />
                    <ZAxis 
                      type="number"
                      dataKey="marginPercent"
                      range={[50, 400]}
                      name="Margin %"
                      unit="%"
                    />
                    <Tooltip 
                      formatter={(value) => ['$', '%'].includes(value) ? value : value.toFixed(2)}
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded shadow-sm">
                              <p className="font-medium">{payload[0].payload.sku}</p>
                              <p className="text-sm">Cost: {formatCurrency(payload[0].payload.cost)}</p>
                              <p className="text-sm">Price: {formatCurrency(payload[0].payload.price)}</p>
                              <p className="text-sm">Margin: {payload[0].payload.marginPercent.toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Scatter 
                      name="Products" 
                      data={priceVsCostData} 
                      fill="#8884d8"
                      shape={(props) => {
                        const { cx, cy, payload } = props;
                        // Color based on margin percentage
                        const margin = payload.marginPercent;
                        let fill;
                        if (margin > 50) fill = '#4CAF50';
                        else if (margin > 30) fill = '#8BC34A';
                        else if (margin > 20) fill = '#CDDC39';
                        else if (margin > 10) fill = '#FFEB3B';
                        else fill = '#F44336';
                        
                        return <circle cx={cx} cy={cy} r={8} fill={fill} />;
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        )}
        
        {hasVendor && (
          <TabsContent value="vendors" className="p-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium mb-4">Top Vendors</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vendorData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vendor" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Product Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Main Component that combines all visualizations
const DataVisualizations = ({ data, businessType, schemas }) => {
  if (!data) return null;
  
  return (
    <Tabs defaultValue="inventory" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="inventory" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span>Inventory</span>
          {data.inventory_on_hand?.length > 0 && (
            <Badge variant="outline" className="ml-1 bg-blue-50">
              {data.inventory_on_hand.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="sales" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span>Sales</span>
          {data.sales_history?.length > 0 && (
            <Badge variant="outline" className="ml-1 bg-blue-50">
              {data.sales_history.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="orders" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Orders</span>
          {data.purchase_orders?.length > 0 && (
            <Badge variant="outline" className="ml-1 bg-blue-50">
              {data.purchase_orders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="products" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span>Products</span>
          {data.item_master?.length > 0 && (
            <Badge variant="outline" className="ml-1 bg-blue-50">
              {data.item_master.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="inventory" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {data.inventory_on_hand?.length > 0 ? (
              <>
                <InventoryVisualization 
                  data={data.inventory_on_hand} 
                  businessType={businessType} 
                />
                <DataQualityHeatmap 
                  data={data.inventory_on_hand}
                  schema={schemas?.inventory_on_hand}
                />
              </>
            ) : (
              <div className="text-center p-8 text-gray-500">
                No inventory data available for visualization
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="sales" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sales_history?.length > 0 ? (
              <>
                <SalesHistoryVisualization 
                  data={data.sales_history} 
                  businessType={businessType} 
                />
                <DataQualityHeatmap 
                  data={data.sales_history}
                  schema={schemas?.sales_history}
                />
              </>
            ) : (
              <div className="text-center p-8 text-gray-500">
                No sales data available for visualization
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="orders" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {data.purchase_orders?.length > 0 ? (
              <>
                <PurchaseOrdersVisualization 
                  data={data.purchase_orders} 
                  businessType={businessType} 
                />
                <DataQualityHeatmap 
                  data={data.purchase_orders}
                  schema={schemas?.purchase_orders}
                />
              </>
            ) : (
              <div className="text-center p-8 text-gray-500">
                No purchase order data available for visualization
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="products" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {data.item_master?.length > 0 ? (
              <>
                <ItemMasterVisualization 
                  data={data.item_master} 
                  businessType={businessType} 
                />
                <DataQualityHeatmap 
                  data={data.item_master}
                  schema={schemas?.item_master}
                />
              </>
            ) : (
              <div className="text-center p-8 text-gray-500">
                No product data available for visualization
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default DataVisualizations;
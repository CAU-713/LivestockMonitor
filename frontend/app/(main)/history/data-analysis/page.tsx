'use client';

import React, { useState } from 'react';
import Grid from '@mui/material/GridLegacy';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  TextField,
  Modal,
  Backdrop,
  Fade,
} from '@mui/material';
import Image from 'next/image';
import {
  mockStatisticsSummary,
  mockCorrelationMatrix,
  mockSheds,
} from '@/constants/mockData';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Style for the modal content
const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '90vw',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 1, // Add a little padding
  outline: 'none',
};

const DataAnalysisPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [shed, setShed] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const handleOpenModal = (imgSrc: string) => {
    setSelectedImage(imgSrc);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const correlationVariables = Object.keys(mockCorrelationMatrix);

  return (
    <>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          数据分析
        </Typography>

        {/* Control Panel */}
        <Card component={Paper} elevation={2}>
          <CardHeader title={<Typography variant="h6">分析设置</Typography>} />
          <CardContent>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems="center"
            >
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="shed-select-label">选择畜舍</InputLabel>
                <Select
                  labelId="shed-select-label"
                  id="shed-select"
                  value={shed}
                  label="选择畜舍"
                  onChange={(e) => setShed(e.target.value)}
                >
                  {mockSheds.map((shed) => (
                    <MenuItem key={shed.id} value={shed.id}>
                      {shed.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="开始日期"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="结束日期"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              <Button variant="contained">开始分析</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Results Display */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="data analysis tabs"
            >
              <Tab label="描述性统计" id="analysis-tab-0" />
              <Tab label="相关性分析" id="analysis-tab-1" />
              <Tab label="平稳性分析 (ACF)" id="analysis-tab-2" />
            </Tabs>
          </Box>

          {/* Tab 1: Descriptive Statistics */}
          <TabPanel value={tabValue} index={0}>
            <Card component={Paper} elevation={2}>
              <CardHeader
                title={<Typography variant="h6">统计摘要</Typography>}
              />
              <CardContent>
                <TableContainer component={Paper}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>变量</TableCell>
                        <TableCell>均值</TableCell>
                        <TableCell>方差</TableCell>
                        <TableCell>标准差</TableCell>
                        <TableCell>最小值</TableCell>
                        <TableCell>最大值</TableCell>
                        <TableCell>计数</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockStatisticsSummary.map((row) => (
                        <TableRow key={row.variable}>
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{ fontWeight: 'medium' }}
                          >
                            {row.variable}
                          </TableCell>
                          <TableCell>{row.mean.toFixed(2)}</TableCell>
                          <TableCell>{row.variance.toFixed(2)}</TableCell>
                          <TableCell>{row.std.toFixed(2)}</TableCell>
                          <TableCell>{row.min}</TableCell>
                          <TableCell>{row.max}</TableCell>
                          <TableCell>{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 2: Correlation Analysis */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Card component={Paper} elevation={2} sx={{ height: '100%' }}>
                  <CardHeader
                    title={<Typography variant="h6">相关性热力图</Typography>}
                  />
                  <CardContent>
                    <Box
                      onClick={() => handleOpenModal('/correlation_heatmap.png')}
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: { xs: 300, md: 400 },
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.9 },
                      }}
                    >
                      <Image
                        src="/correlation_heatmap.png"
                        alt="Correlation Heatmap"
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card component={Paper} elevation={2} sx={{ height: '100%' }}>
                  <CardHeader
                    title={
                      <Typography variant="h6">
                        Pearson 相关系数矩阵
                      </Typography>
                    }
                  />
                  <CardContent>
                    <TableContainer component={Paper} sx={{ maxHeight: 450 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>变量</TableCell>
                            {correlationVariables.map((v) => (
                              <TableCell key={v}>{v}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {correlationVariables.map((rowVar) => (
                            <TableRow key={rowVar}>
                              <TableCell
                                component="th"
                                scope="row"
                                sx={{ fontWeight: 'medium' }}
                              >
                                {rowVar}
                              </TableCell>
                              {correlationVariables.map((colVar) => (
                                <TableCell key={colVar}>
                                  {mockCorrelationMatrix[rowVar]?.[
                                    colVar
                                  ]?.toFixed(2) ?? 'N/A'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 3: Stationarity Analysis (ACF) */}
          <TabPanel value={tabValue} index={2}>
            <Card component={Paper} elevation={2}>
              <CardHeader
                title={<Typography variant="h6">ACF 平稳性分析</Typography>}
              />
              <CardContent>
                <Box
                  onClick={() => handleOpenModal('/acf_all_variables.png')}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: { xs: 300, md: 400 },
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.9 },
                  }}
                >
                  <Image
                    src="/acf_all_variables.png"
                    alt="ACF Plot"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      </Stack>

      {/* Image Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={modalOpen}>
          <Box sx={modalStyle}>
            <img
              src={selectedImage}
              alt="Enlarged view"
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                maxHeight: 'calc(90vh - 16px)', // Adjust for padding (p:1 -> 8px * 2)
                objectFit: 'contain',
              }}
            />
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default DataAnalysisPage;

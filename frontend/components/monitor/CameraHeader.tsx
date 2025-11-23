'use client';
import React, { useState } from 'react';
import {
  Button,
  Popover,
  List,
  ListItem,
  ListItemText,
  Collapse,
  ListItemButton,
  Stack,
  Typography,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import type { Shed, Camera } from '../../types';

type Props = {
  sheds: Shed[];
  cameras: Camera[];
  selectedCameraId: string | null;
  onSelectCamera: (id: string) => void;
};

export default function CameraHeader({
  sheds,
  cameras,
  selectedCameraId,
  onSelectCamera,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedShedId, setExpandedShedId] = useState<string | null>(
    sheds.length > 0 ? sheds[0].id : null
  );

  const selectedCamera =
    cameras.find((c) => c.id === selectedCameraId) ?? cameras[0] ?? null;

  const handleSelectCamera = (id: string) => {
    onSelectCamera(id);
    setAnchorEl(null); // Close popover on selection
  };

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary" fontWeight={500}>舍:</Typography>
        <Typography variant="body2" fontWeight={500}>
          {sheds.find((s) => s.id === selectedCamera?.shedId)?.name ?? sheds[0]?.name ?? '-'}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Typography variant="body2" color="text.secondary" fontWeight={500}>摄像头:</Typography>
        <Typography variant="body2" fontWeight={500}>
          {selectedCamera?.name ?? selectedCamera?.id ?? '-'}
        </Typography>

        <div>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            选择摄像头
          </Button>

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { maxWidth: 340, mt: 0.5 } }}
          >
            <List dense sx={{ width: 320 }}>
              {sheds.map((shed) => (
                <div key={shed.id}>
                  <ListItemButton
                    onClick={() => setExpandedShedId((prev) => (prev === shed.id ? null : shed.id))}
                  >
                    <ListItemText primary={shed.name} />
                    {expandedShedId === shed.id ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>

                  <Collapse in={expandedShedId === shed.id} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 2 }}>
                      {cameras.filter((c) => c.shedId === shed.id).length === 0 && (
                        <ListItem><ListItemText secondary="(无摄像头)" /></ListItem>
                      )}
                      {cameras
                        .filter((c) => c.shedId === shed.id)
                        .map((cam) => (
                          <ListItemButton
                            key={cam.id}
                            selected={selectedCameraId === cam.id}
                            onClick={() => handleSelectCamera(cam.id)}
                          >
                            <ListItemText primary={cam.name} />
                          </ListItemButton>
                        ))}
                    </List>
                  </Collapse>
                </div>
              ))}
            </List>
          </Popover>
        </div>
      </Stack>
    </>
  );
}

import { DeviceEventEmitter } from 'react-native';

export type ThemedAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type ThemedAlertPayload = {
  title: string;
  message?: string;
  buttons: ThemedAlertButton[];
};

export function themedAlert(
  title: string,
  message?: string,
  buttons?: ThemedAlertButton[]
) {
  DeviceEventEmitter.emit('themedAlert', {
    title,
    message,
    buttons: buttons?.length ? buttons : [{ text: 'OK', style: 'default' }],
  } satisfies ThemedAlertPayload);
}

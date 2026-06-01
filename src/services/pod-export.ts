import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import {
  formatPodExportNotes,
  formatPodExportTsv,
  podExportFilename,
} from '@/src/domain/pod-export';
import type { Pod, PodMemberView } from '@/src/domain/types';

export async function copyPodTsv(pod: Pod, roster: PodMemberView[]): Promise<void> {
  await Clipboard.setStringAsync(formatPodExportTsv(pod, roster));
}

export async function copyPodNotes(pod: Pod, roster: PodMemberView[]): Promise<void> {
  await Clipboard.setStringAsync(formatPodExportNotes(pod, roster));
}

export async function sharePodTsvFile(pod: Pod, roster: PodMemberView[]): Promise<void> {
  const tsv = formatPodExportTsv(pod, roster);
  const filename = podExportFilename(pod);
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, tsv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/tab-separated-values',
      dialogTitle: `Export ${pod.name}`,
      UTI: 'public.tab-separated-values-text',
    });
  } else {
    await Share.share({ message: tsv, title: filename });
  }
}

/** Opens the system share sheet — user can pick Apple Notes, Messages, etc. */
export async function sharePodNotes(pod: Pod, roster: PodMemberView[]): Promise<void> {
  const message = formatPodExportNotes(pod, roster);
  await Share.share({ message, title: `${pod.name} — Peas in a Pod` });
}

import React from 'react';
import { EDITORIAL_CSS } from './styles.js';

export function VerisourceStyleTag(): React.ReactElement {
  return <style dangerouslySetInnerHTML={{ __html: EDITORIAL_CSS }} />;
}

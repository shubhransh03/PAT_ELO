import express from 'express';
console.log('Express version', express?.application?.settings ? require('./package.json').dependencies.express : 'unknown');

const Ably = require('ably');

// Initialize Ably with your API key
const ably = new Ably.Realtime(
  'Squ8ag.ex4hJg:Et2nm7jw0emMoDvrYbfeicLIZn9tYGUakJvIJ9slFoc'
);
const publishRateChannel = ably.channels.get('set-publish-rate');
const channel = ably.channels.get('messages');

// Rate limiting configuration
const MAX_RATE_PER_SECOND = 50;
let messageQueue = [];
let publishRate = 1; // Default rate of 1 message per second
let messageGeneratorInterval;

// Subscribe to publish rate changes
publishRateChannel.subscribe('rate', (message) => {
  publishRate = parseInt(message.data);
  console.log(`Updated publish rate to ${publishRate} messages per second.`);
  adjustMessageGeneration();
});

// Adjust message generation based on the current publish rate
function adjustMessageGeneration() {
  if (messageGeneratorInterval) {
    clearInterval(messageGeneratorInterval);
  }

  if (publishRate > 0) {
    messageGeneratorInterval = setInterval(() => {
      messageQueue.push(generateMessage());
      managePublishing();
    }, 1000 / publishRate);
  }
}

// Decide to publish via batch or via a single message
function managePublishing() {
  if (publishRate <= MAX_RATE_PER_SECOND) {
    if (messageQueue.length > 0) {
      publishMessage();
    }
  } else {
    if (messageQueue.length >= MAX_RATE_PER_SECOND) {
      publishBatch();
    }
  }
}

// Publish a single message from the queue
function publishMessage() {
  const message = messageQueue.shift();
  console.log(message);
  channel.publish('message', message, (err) => {
    if (err) {
      console.log('Failed to publish message:', err);
    }
  });
}

// Publish messages in batches at maximum publish rate
function publishBatch() {
  let batchSize = Math.ceil(publishRate / MAX_RATE_PER_SECOND);
  let batch = messageQueue.splice(0, Math.min(batchSize, messageQueue.length));

  console.log('Batch published successfully', batch.length, 'messages');
  channel.publish('batch', batch, (err) => {
    if (err) {
      console.log('Failed to publish batch:', err);
    } else {
      console.log('Batch published successfully', batch.length, 'messages');
    }
  });
}

// Generate a random message
function generateMessage() {
  return {
    timestamp: Date.now(),
  };
}

// Initialize message generation based on the initial rate
adjustMessageGeneration();

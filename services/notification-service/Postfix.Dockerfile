FROM debian:stable-slim

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y postfix \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN postconf -e "relayhost = [smtp-server.rit.edu]:25" \
    && postconf -e "inet_interfaces = all" \
    && postconf -e "inet_protocols = ipv4" \
    && postconf -e "mydestination =" \
    && postconf -e "mynetworks = 172.30.0.0/16" \
    && postconf -e "relay_domains = *" \
    && postconf -e "maillog_file = /dev/stdout" \
    && postconf -e "smtpd_relay_restrictions = permit_mynetworks, reject_unauth_destination"

EXPOSE 25

CMD ["sh", "-c", "postfix start-fg"]
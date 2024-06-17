import {transporter} from "./transporter";

export class Mailer {

    from: string;
    to: string;

    constructor(from = 'prawin3337@gmail.com', to = 'bhosale.pravinp@gmail.com, swapnashilpheights@gmail.com') {
        this.from = from;
        this.to = to;
    }

    async sendMail(subject = 'From societ server admin', text: string, html: string) {
        try {
            const info = await transporter.sendMail({
                from: this.from,
                to: this.to,
                subject: subject,
                text: text,
                html: html
            });

            console.log("Message sent: %s", info.messageId);
            return info;
        } catch(err) {
            console.log("Mail send fail", err);
        }
        
    }
}